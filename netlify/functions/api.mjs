import mysql from "mysql2/promise";

export default async (req) => {
  let db;

  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 4000),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true
      }
    });

    // TABRIKLARNI OLISH
    if (req.method === "GET") {
      const [rows] = await db.execute(
  SELECT id, name, message, created_at, gift_count
   FROM notes
   ORDER BY id DESC
   LIMIT 100
);

      return Response.json(rows);
    }

    // MA'LUMOT SAQLASH
    if (req.method === "POST") {
      const body = await req.json();

      // SOVG'A BOSILGANDA
      if (body.action === "gift") {
        const id = Number(body.id);

        if (!Number.isInteger(id) || id < 1) {
          return Response.json(
            { error: "Noto'g'ri ID" },
            { status: 400 }
          );
        }

        const [result] = await db.execute(
          "UPDATE notes SET gift_count = gift_count + 1 WHERE id = ?",
          [id]
        );

        if (result.affectedRows === 0) {
          return Response.json(
            { error: "Tabrik topilmadi" },
            { status: 404 }
          );
        }

        const [rows] = await db.execute(
          "SELECT gift_count FROM notes WHERE id = ?",
          [id]
        );

        return Response.json({
          gift_count: rows[0].gift_count
        });
      }

      // YANGI TABRIK SAQLASH
      const name = String(body.name ?? "").trim().slice(0, 60);
      const message = String(body.message ?? "").trim().slice(0, 500);

      if (!name || !message) {
        return Response.json(
          { error: "Ism va tabrik matnini kiriting" },
          { status: 400 }
        );
      }

      await db.execute(
        "INSERT INTO notes (name, message) VALUES (?, ?)",
        [name, message]
      );

      return Response.json(
        { success: true },
        { status: 201 }
      );
    }

    return Response.json(
      { error: "Method not allowed" },
      { status: 405 }
    );

  } catch (err) {
    console.error("API xatosi:", err);

    return Response.json(
      { error: "Server xatosi. Ma'lumotlar bazasini tekshiring." },
      { status: 500 }
    );

  } finally {
    if (db) await db.end();
  }
};
