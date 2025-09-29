from flask import Flask, render_template, request, jsonify
import os
import sqlite3

app = Flask(__name__)
DB = 'guardadoSQL.db'

# Función para crear la tabla si no existe
def init_db():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS archivo_de_guardado (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_guardado TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    # indexColorSearch
    # indexExperimentalHighlights
    # indexEveryWordInRange
    # betaNameIndex
    return render_template('index.html')


# Ruta para guardar localmente (recibe JSON)
@app.route('/local', methods=['POST'])
def save_file():
    data = request.get_json()
    content = data.get("content", "")

    ruta = os.path.join(os.getcwd(), "codigo_guardado.vhdl")

    with open(ruta, "w", encoding="utf-8") as f:
        f.write(content)

    return jsonify({"message": f"Archivo guardado en {ruta}"})


# Ruta para guardar contenido (recibe JSON)
@app.route('/guardar', methods=['POST'])
def guardar():
    data = request.get_json()
    contenido = data.get('contenido', '')

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO archivo_de_guardado (codigo_guardado) VALUES (?)', (contenido,))
    conn.commit()
    conn.close()

    return jsonify({'status': 'ok'})


# Ruta para obtener el contenido guardado más reciente
@app.route('/cargar', methods=['GET'])
def cargar():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('SELECT codigo_guardado FROM archivo_de_guardado ORDER BY id DESC LIMIT 1')
    fila = cursor.fetchone()
    conn.close()

    if fila:
        return jsonify({'contenido_cargado': fila[0]})
    else:
        return jsonify({'contenido_cargado  ': ''})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
