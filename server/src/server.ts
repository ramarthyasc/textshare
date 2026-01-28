import app from "./index";


app.listen(Number(process.env.PORT), () => {
    console.log("Server listening at :", Number(process.env.PORT));
})


