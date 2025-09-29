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

    let extraKeyWords = [];
    let currentDecorations = [];
    let currentLanguageChoice = "";
    let languageStyle = "";

    const comboboxSelection = document.getElementById("lenguaje");
    console.log(comboboxSelection.value);
    monaco.languages.register({ id: comboboxSelection.value });
    monaco.editor.setModelLanguage(editor.getModel(), comboboxSelection.value);
    keywordDecorationActivation();

    // Combobox
    comboboxSelection.addEventListener("change", function() {
        keywordDecorationActivation();
    });

    editor.onDidChangeModelContent((e) => {
        if(currentLanguageChoice !== "customVdhl"){
            currentDecorations = highlightWords(extraKeyWords, "micropyhton-keywords-style", currentDecorations);
        }
    });
    
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

    function keywordDecorationActivation(){
        currentLanguageChoice = comboboxSelection.value;
        currentDecorations = editor.deltaDecorations(currentDecorations, []);
        monaco.languages.register({
            id: currentLanguageChoice
        });
        monaco.editor.setModelLanguage(editor.getModel(), currentLanguageChoice);
        switch(currentLanguageChoice){
            case("customVhdl"):
                extraKeyWords = "";
                fetch('/static/assets/vhdl_token_data.json')
                    .then(res => res.json())
                    .then(vhdlTokens => {
                        monaco.languages.setMonarchTokensProvider('customVhdl', vhdlTokens.tokenConfig);
                        monaco.editor.defineTheme('color-theme', vhdlTokens.tokenRules);
                        monaco.editor.setTheme('color-theme');
                });
                return;
            case("python"):
                languageStyle = 'micropyhton-keywords-style';
                extraKeyWords = 'machine|network|utime|uos|I2C|SPI|ADC|PWM';
                break;
            case("c"):
                languageStyle = 'arduino-keywords-style';
                extraKeyWords = 'setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay';
                break;
        }
        currentDecorations = highlightWords(extraKeyWords, languageStyle, currentDecorations);
    }

    function highlightWords(keywords, cssDeco, currentDecorations) {
        currentDecorations = editor.deltaDecorations(currentDecorations, []);
        const editorModel = editor.getModel();
        const matches = editorModel.findMatches(keywords, true, true, false, null, true);

        const decorations = matches.map(m => ({
            range: m.range,
            options: { inlineClassName: cssDeco }
        }));
        currentDecorations = currentDecorations.concat(decorations);
        return editor.deltaDecorations(currentDecorations, decorations);
    }

});