import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  withCredentials: true,   // ← required for Flask session cookies to work
});

export default api;
