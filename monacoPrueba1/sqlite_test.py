import sqlite3

# Conectar (o crear) base de datos
conn = sqlite3.connect("mi_base.db")
cursor = conn.cursor()

# Crear tabla
cursor.execute("CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, nombre TEXT)")

# Insertar datos
cursor.execute("INSERT INTO usuarios (nombre) VALUES (?)", ("Ana",))

# Guardar cambios
conn.commit()

# Consultar datos
cursor.execute("SELECT * FROM usuarios")
print(cursor.fetchall())

# Cerrar conexión
conn.close()
