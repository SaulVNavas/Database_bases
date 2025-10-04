require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });

require(['vs/editor/editor.main'], function () {

    window.editor = monaco.editor.create(document.getElementById('editor'), {
        value: '',
        language: 'python',
        theme: 'vs-dark',
    });

    let currentDecorations = [];
    let currentLanguageChoice = "";
    let languageDecorations = [];

    const comboboxSelection = document.getElementById("lenguaje");
    monaco.languages.register({ id: comboboxSelection.value });
    monaco.editor.setModelLanguage(editor.getModel(), comboboxSelection.value);

    // Combobox
    comboboxSelection.addEventListener("change", function() {
        keywordDecorationActivation();
    });

    editor.onDidChangeModelContent((e) =>
        highlightWords()
    );
    
    // Botón de guardado en archivo local
    document.getElementById("localBtn").addEventListener('click', function (){
        const texto = window.editor.getValue();

        fetch('/local', {
            // Indica que es una petición POST (para enviar datos al servidor).
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: texto
            })
        })
        // res es un objeto Response con la respuesta de la solicitud; se devuelve el JSON
        .then(res => res.json())
        // data.message es el mensaje de confirmación
        .then(data => {
            alert(data.message);
        })
        .catch(err => {
            console.error(err);
            alert("Error guardando el archivo");
        });
    });

    // Botón de guardado en SQL
    document.getElementById('guardarBtn').addEventListener('click', () => {
        const contenido = window.editor.getValue();
        fetch('/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contenido })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok')
                alert('Contenido guardado correctamente');
        })
        .catch(err => {
            console.error(err);
            alert("Error guardando el archivo");
        });
    });

    // Botón de cargar contenido
    document.getElementById('cargarBtn').addEventListener('click', () => {
        fetch('/cargar')
            .then(response => response.json())
            .then(data => {
                window.editor.setValue(data.contenido_cargado || '');
            });
    });

    keywordDecorationActivation();

    // Activación de colores en palabras reservadas
    function keywordDecorationActivation(){
        currentLanguageChoice = comboboxSelection.value;

        languageDecorations = [];
        monaco.languages.register({
            id: currentLanguageChoice
        });
        monaco.editor.setModelLanguage(editor.getModel(), currentLanguageChoice);

        fetch('/static/assets/language_decorations_data.json')
            .then(res => res.json())
            .then(decorations => {

                let languageInfo = decorations[currentLanguageChoice];

                languageDecorations = languageInfo.decorations_info;

                if(languageInfo.hasTokens){
                    fetch(languageInfo.tokenDataRoute)
                        .then(res => res.json())
                        .then(languageTokens => {
                            monaco.languages.setMonarchTokensProvider(currentLanguageChoice, languageTokens.tokenConfig);
                            monaco.editor.defineTheme("language-custom-theme", languageTokens.tokenRules);
                            monaco.editor.setTheme("language-custom-theme");
                    });
                }
                highlightWords();
        });
    }

    // Registro de decoradores
    function highlightWords() {
        currentDecorations = editor.deltaDecorations(currentDecorations, []);
        let newDecorations = [];
        languageDecorations.forEach(languageDecoration => {
            const editorModel = editor.getModel();
            const matches = editorModel.findMatches(languageDecoration.regex, true, true, false, null, true);

            const decoration = matches.map(m => ({
                range: m.range,
                options: { inlineClassName: languageDecoration.style }
            }));
            newDecorations = newDecorations.concat(decoration);
        });
        currentDecorations = editor.deltaDecorations(currentDecorations, newDecorations);

    }

});