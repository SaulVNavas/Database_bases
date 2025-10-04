require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });

require(['vs/editor/editor.main'], function () {

    window.editor = monaco.editor.create(document.getElementById('editor'), {
        value: [
            '---------------------------------- ARDUINO ----------------------------------',
            '',
            '#include <Servo.h>',
            'Servo myServo; // Create a Servo object', "",
            'void setup() {',
            '    myServo.attach(9); // Attach servo to pin 9',
            '}',
            'void loop() {',
            '   for (int pos = 0; pos <= 180; pos++) { // Move from 0° to 180°',
            '       myServo.write(pos);',
            '       delay(15);',
            '   }',
            '}',
            '',
            '------------------------------------ VHDL -----------------------------------',
            '',
            'library ieee;',
            'use ieee.std_logic_1164.all;',
            'use ieee.numeric_std.all;',
            '',
            'entity signed_adder is',
            '   port',
            '   (',
            '       aclr : in   std_logic;',
            '       clk  : in   std_logic;',
            '       a    : in   std_logic_vector;',
            '       b    : in   std_logic_vector;',
            '       q    : out  std_logic_vector',
            '   );',
            'end signed_adder;',
            '',
            'architecture signed_adder_arch of signed_adder is',
            '   signal q_s : signed(a\'high+1 downto 0); -- extra bit wide',
            '',
            'begin -- architecture',
            '   assert(a\'length >= b\'length)',
            '       report "Port A must be the longer vector if different sizes!"',
            '       severity FAILURE;',
            '   q <= std_logic_vector(q_s);',
            '   adding_proc:',
            '   process (aclr, clk)',
            '       begin',
            '           if (aclr = \'1\') then',
            '               q_s <= (others => \'0\');',
            '           elsif rising_edge(clk) then',
            '               q_s <= (\'0\'&signed(a)) + (\'0\'&signed(b));',
            '           end if; -- clk\'d',
            '       end process;',
            'end signed_adder_arch;',
            '',
            '-------------------------------- MICROPYTHON --------------------------------',
            '',
            'from machine import Pin',
            'import time',
            '',
            'pin_led = Pin(25, mode=Pin.OUT)',
            '',
            'while True',
            '',
            '   pin_led.on()',
            '   time.sleep(1)',
            '   pin_led.off()',
            '   time.sleep(1)',
        ].join('\n'),
        language: 'python',
        theme: 'vs-dark',
    });

    let currentDecorations = [];
    let currentLanguageChoice = "";
    let languageDecorations = [];

    const comboboxSelection = document.getElementById("lenguaje");
    console.log(comboboxSelection.value);
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