import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);
let routesRegistered = false;

export default async (req, res) => {
    if (!routesRegistered) {
        await registerRoutes(httpServer, app);
        routesRegistered = true;
    }
    app(req, res);
};
