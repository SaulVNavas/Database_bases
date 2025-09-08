from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)
DB = 'guardadoSQL.db'

# Función para crear la tabla si no existe
def init_db():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_guardado TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('indexModified.html')

# Ruta para guardar contenido (recibe JSON)
@app.route('/guardar', methods=['POST'])
def guardar():
    data = request.get_json()
    contenido = data.get('contenido', '')

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO documentos (codigo_guardado) VALUES (?)', (contenido,))
    conn.commit()
    conn.close()

    return jsonify({'status': 'ok'})

# Ruta para obtener el contenido guardado más reciente
@app.route('/cargar', methods=['GET'])
def cargar():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('SELECT contenido FROM documentos ORDER BY id DESC LIMIT 1')
    fila = cursor.fetchone()
    conn.close()

    if fila:
        return jsonify({'contenido': fila[0]})
    else:
        return jsonify({'contenido': ''})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
