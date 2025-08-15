from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DB = 'app.db'

# Función para crear la tabla si no existe
def init_db():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS base_de_texto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto_guardado TEXT
        )
    ''')
    conn.commit()
    conn.close()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/local', methods=['POST'])
def guardar_local():
    datos = request.get_json()
    contenido = datos.get("content", "")

    ruta = os.path.join(os.getcwd(), "codigo_guardado.py")

    with open(ruta, "w", encoding="utf-8") as archivo:
        archivo.write(contenido)
    
    return jsonify({"message": f"Archivo guardado en {ruta}"})


# Ruta para guardar contenido (recibe JSON)
@app.route('/guardar', methods=['POST'])
def guardar():
    datos = request.get_json()
    contenido = datos.get('contenido', '')

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO base_de_texto (texto_guardado) VALUES (?)', (contenido,))
    conn.commit()
    conn.close()

    return jsonify({'status': 'ok'})


# Ruta para obtener el contenido guardado más reciente
@app.route('/cargar', methods=['GET'])
def cargar():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('SELECT texto_guardado FROM base_de_texto ORDER BY id DESC LIMIT 1')
    fila = cursor.fetchone()
    conn.close()

    if fila:
        return jsonify({'texto_guardado': fila[0]})
    else:
        return jsonify({'texto_guardado': ''})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
