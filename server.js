const path = require("path");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "contacts.db");
const db = new sqlite3.Database(DB_PATH);

const SAMPLE_CONTACTS = [
  {
    firstName: "Juan",
    lastName: "Perez",
    phone: "3001234567",
    city: "Bogota",
    address: "Calle 10 # 20-30",
    gender: "masculino",
  },
  {
    firstName: "Maria",
    lastName: "Gomez",
    phone: "3017654321",
    city: "Medellin",
    address: "Carrera 45 # 12-88",
    gender: "femenino",
  },
  {
    firstName: "Carlos",
    lastName: "Rodriguez",
    phone: "3029988776",
    city: "Cali",
    address: "Avenida 5 # 18-42",
    gender: "masculino",
  },
];

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function normalizeContact(row) {
  return {
    id: Number(row.id),
    firstName: String(row.firstName || ""),
    lastName: String(row.lastName || ""),
    phone: String(row.phone || ""),
    city: String(row.city || ""),
    address: String(row.address || ""),
    gender: row.gender === "femenino" ? "femenino" : "masculino",
  };
}

async function ensureDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('masculino', 'femenino'))
    )
  `);
}

async function seedDatabase() {
  const row = await getOne("SELECT COUNT(*) AS total FROM contacts");

  if (Number(row.total) > 0) {
    return;
  }

  for (const contact of SAMPLE_CONTACTS) {
    await run(
      `INSERT INTO contacts (firstName, lastName, phone, city, address, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        contact.firstName,
        contact.lastName,
        contact.phone,
        contact.city,
        contact.address,
        contact.gender,
      ],
    );
  }
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/contacts", async (_req, res) => {
  try {
    const rows = await getAll("SELECT * FROM contacts ORDER BY id DESC");
    res.json(rows.map(normalizeContact));
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los contactos" });
  }
});

app.post("/api/contacts", async (req, res) => {
  const { firstName = "", lastName = "", phone = "", city = "", address = "", gender = "" } = req.body || {};
  const normalizedGender = gender === "femenino" ? "femenino" : "masculino";

  try {
    const result = await run(
      `INSERT INTO contacts (firstName, lastName, phone, city, address, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(firstName).trim(),
        String(lastName).trim(),
        String(phone).trim(),
        String(city).trim(),
        String(address).trim(),
        normalizedGender,
      ],
    );

    const created = await getOne("SELECT * FROM contacts WHERE id = ?", [result.lastID]);
    res.status(201).json(normalizeContact(created));
  } catch (error) {
    res.status(500).json({ message: "Error al crear el contacto" });
  }
});

app.put("/api/contacts/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getOne("SELECT * FROM contacts WHERE id = ?", [id]);

  if (!existing) {
    return res.status(404).json({ message: "Contacto no encontrado" });
  }

  const { firstName = existing.firstName, lastName = existing.lastName, phone = existing.phone, city = existing.city, address = existing.address, gender = existing.gender } = req.body || {};
  const normalizedGender = gender === "femenino" ? "femenino" : "masculino";

  try {
    await run(
      `UPDATE contacts
       SET firstName = ?, lastName = ?, phone = ?, city = ?, address = ?, gender = ?
       WHERE id = ?`,
      [
        String(firstName).trim(),
        String(lastName).trim(),
        String(phone).trim(),
        String(city).trim(),
        String(address).trim(),
        normalizedGender,
        id,
      ],
    );

    const updated = await getOne("SELECT * FROM contacts WHERE id = ?", [id]);
    res.json(normalizeContact(updated));
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el contacto" });
  }
});

app.delete("/api/contacts/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await run("DELETE FROM contacts WHERE id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Contacto no encontrado" });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el contacto" });
  }
});

app.delete("/api/contacts", async (_req, res) => {
  try {
    await run("DELETE FROM contacts");
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar los contactos" });
  }
});

ensureDatabase()
  .then(seedDatabase)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
      console.log(`Base de datos SQLite: ${DB_PATH}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar la base de datos", error);
    process.exit(1);
  });