import app from "./Src/App.js";

app.listen(process.env.PORT, () => {
  console.log(`Server is running on Port : ${process.env.PORT}`);
});
