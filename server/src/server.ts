import app from "./app";


app.listen(Number(process.env.PORT), () => {
    console.log("Server listening at :", Number(process.env.PORT));
})


