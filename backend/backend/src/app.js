import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Necessário no Render/Vercel/qualquer plataforma atrás de proxy reverso —
// sem isso, o rate limit (e req.ip em geral) enxerga o IP do proxy em vez
// do IP real de quem fez a requisição.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  })
);
app.use(express.json());

// Healthcheck — útil para confirmar que o deploy está de pé
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Precisa ser o último middleware registrado
app.use(errorHandler);