import { Editor } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useState, useRef, useEffect } from 'react';
import highlightsData from "./assets/highlights.json";
import "./assets/styles.css";

import './App.css';

function Appy() {
  const [editorContent, setEditorContent] = useState("holaaaa :)");
  const [currentLanguage, setCurrentLanguage] = useState(['Arduino', 'c']);

  const monacoRef = useRef<typeof monaco | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)


  const keywordDecorationActivation = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let comboboxNewValue = event.target.value
    if(comboboxNewValue === currentLanguage[0]) return
    
    const baseLanguagesKey = comboboxNewValue as keyof typeof highlightsData.baseLanguages
    setCurrentLanguage([
      comboboxNewValue,
      highlightsData.baseLanguages[baseLanguagesKey]
    ]);
  }    

  const updateDecorations = () => {
    if (!editorRef.current) return

    const editorModel = editorRef.current.getModel();
    if (!editorModel) return
    
    let newDecorations: monaco.editor.IModelDeltaDecoration[] = []
    const decorationsInfo =
      highlightsData.decorations[currentLanguage[0] as keyof typeof highlightsData.decorations]
    
      decorationsInfo.forEach(decoInfo => {
      const matches = editorModel.findMatches(decoInfo.regex, true, true, false, null, true);
      const decoration = matches.map(m => ({
          range: m.range,
          options: { inlineClassName: decoInfo.style }
      }));
      newDecorations = newDecorations.concat(decoration);
    });
    
    if (!decorationsRef.current) {
      decorationsRef.current = editorRef.current.createDecorationsCollection(newDecorations);
    } else {
      // Actualizar decoraciones
      decorationsRef.current.set(newDecorations);
    }
  }

  const updateTokens = () => {
    if (!editorRef.current || !monacoRef.current) return

    const tokensInfo =
      highlightsData.tokens[currentLanguage[0] as keyof typeof highlightsData.tokens]
    if(!tokensInfo.hasTokens || !tokensInfo.tokenConfig) return

    monacoRef.current.languages.register({ id: currentLanguage[1] });

    monacoRef.current.languages.setMonarchTokensProvider(
      currentLanguage[1],
      tokensInfo.tokenConfig as monaco.languages.IMonarchLanguage
    );

    let tokenRules = tokensInfo.tokenRules
    monacoRef.current.editor.defineTheme(
      "language-custom-theme",
      {
        base: tokenRules.base as monaco.editor.IStandaloneThemeData["base"],
        inherit: tokenRules.inherit as monaco.editor.IStandaloneThemeData["inherit"],
        rules: tokenRules.rules as monaco.editor.ITokenThemeRule[],
        colors: tokenRules.colors as monaco.editor.IStandaloneThemeData["colors"]
      }
    );
    monacoRef.current.editor.setTheme("language-custom-theme");

  }


  useEffect(() => {
    console.log("Nuevo lenguaje: ", currentLanguage)

    const editor = editorRef.current;
    if (!editor) return
    const editorModel = editor.getModel();
    if (!editorModel) return
    
    updateDecorations()
    updateTokens()
  }, [currentLanguage])

  return (
    <>
      <Editor
        height="40vh"
        theme="vs-dark"
        language={currentLanguage[1]}
        value={editorContent}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco
          editorRef.current = editor
          decorationsRef.current = editor.createDecorationsCollection()
        }}
        onChange={(value) => {
          setEditorContent(value ?? "")
          updateDecorations()
        }}
      />

      <button id="localBtn">Guardar local</button>
      <button id="guardarBtn">Guardar contenido</button>
      <button id="cargarBtn">Cargar contenido</button>

      <br />
      <label className="lenguaje">Selecciona un lenguaje:</label>
      <br />
      <select
        id="lenguaje"
        className="lenguaje"
        value = { currentLanguage[0] }
        onChange={ (event) => {
          keywordDecorationActivation(event)
        }}
      >
        <option value="Arduino">Arduino</option>
        <option value="Micropython">Micropython</option>
        <option value="Vhdl">VHDL</option>
      </select>
      <br />
      <label className="lenguaje">
        Lenguaje actual: {currentLanguage[0]}
      </label>
    </>
  );
}

export default Appy;
