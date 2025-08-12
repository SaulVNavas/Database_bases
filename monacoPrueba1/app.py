from flask import Flask, render_template, request, jsonify

import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/save', methods=['POST'])
def guardar_archivos():
    datos = request.get_json()
    content = datos.get("content", "")

    ruta = os.path.join(os.getcwd(), "codigo_guardado.py")

    with open(ruta, "w", encoding="utf-8") as archivo:
        archivo.write(content)
    
    return jsonify({"message": f"Archivo guardado en {ruta}"})


if __name__ == '__main__':
    app.run(debug=True)