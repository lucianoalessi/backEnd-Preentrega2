import express from "express"; // Importando el módulo Express para crear y configurar la aplicación.
import __dirname from "../utils.js"; //importando rutas absolutas para evitar asuntos de ruteo relativo.
import handlebars from 'express-handlebars'; //importando plantillas con handlebars
import { Server } from "socket.io"; //importamos socket io (websockets)
import productsRouter from './routers/products.router.js'; // Importamos las rutas 
import cartsRouter from './routers/carts.router.js';
import viewsRouter from './routers/views.router.js';
import mongoose, { connect } from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import sessionRouter from './routers/sessions.router.js';
import cookieParser from "cookie-parser";

//importaciones para passport: 
import passport from "passport";
import initializePassport from "./config/passport.config.js";

//Importamos los modelos de datos de producto y mensajes desde archivos separados.En este caso con mongoDB:
//Import ProductManager from "./ProductManager.js"; //CON FILE SYSTEM
import ProductManager from "./dao/managersMongoDb/ProductManagerMongo.js";
import messageManager from "./dao/managersMongoDb/MessageManagerMongo.js";

//importamos dotenv:
import config from './config/config.js'




//Creando una instancia de la aplicación Express.
const app = express()

//Iniciando el servidor Express para escuchar en el puerto 8080.
const port = config.PORT
const httpServer = app.listen( port , () => {console.log('Server ON')})

//Creamos un servidor Socket viviendo dentro de nuestro servidor principal:
const socketServer = new Server(httpServer);

//Configuraciones o Middlewares:

app.use(express.json()); // Configurando Express para parsear JSON en las solicitudes.
app.use(express.urlencoded({extended:true})); // Configurando Express para parsear datos de formularios en las solicitudes.
app.use(express.Router()); // Creando una instancia de un enrutador Express.

//Conexion a mongo Atlas:

mongoose.connect(config.MONGO_URL)


//Session para login (configuracion)

app.use(session({
    // Creo una nueva instancia de MongoStore para almacenar las sesiones en MongoDB
    store: MongoStore.create({
        // Especifico la URL de conexión a tu base de datos MongoDB
        mongoUrl: config.MONGO_URL,
        // Establezco un tiempo de vida máximo para las sesiones en segundos (3600 segundos = 1 hora)
        ttl:3600
    }),
    // Establezco una clave secreta para firmar las cookies de sesión (debe ser una cadena segura):
    secret: 'CoderSecret',
    // No vuelvas a guardar la sesión si no ha cambiado desde la última vez que se guardó:
    resave: false,
    // No guardar una sesión si no se ha inicializado (para ahorrar espacio en la base de datos):
    saveUninitialized: false
}))

//Passport:

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

//Middleware para jwt, manejo de token en cookies:

app.use(cookieParser());



//Configuraciones para plantillas handlebars:

app.engine('handlebars' , handlebars.engine());
app.set('views', __dirname + '/src/views');
app.set('view engine', 'handlebars');
app.use(express.static(__dirname +'/src/public'));

//Rutas utilizadas:

app.use('/api/products' , productsRouter); // Usando el router de productos para las rutas que comienzan con '/api/products'.
app.use('/api/carts' , cartsRouter); // Usando el router de carritos para las rutas que comienzan con '/api/carts'.
app.use('/', viewsRouter); //router handlebars para io con '/'.
app.use('/api/sessions', sessionRouter); // ruta para las sessions 







//creamos una instancia de ProductManager y Messagemanager con mongoDB.

//const pManager = new ProductManager(__dirname +'/files/products.json');  //CON FILE SYSTEM.
const pManager = new ProductManager();
const mManager = new messageManager();




// Configurar el evento de conexión de Socket.IO

socketServer.on('connection', async (socket) => {

    console.log("nuevo cliente conectado")

    

    //websockets para Productos:

    const products = await pManager.getProducts()
    socket.emit('productos', products); //enviamos al cliente un array con todos los productos.

    //recibimos informacion del cliente, en este caso un nuevo producto y lo agregamos a nuestra base de datos. 
    socket.on('addProduct', async data => {

        await pManager.addProduct(data)
        const updateProducts = await pManager.getProducts();
        socket.emit('updatedProducts', updateProducts ); //le enviamos al cliente la lista de productos actualizada con el producto que anteriormente agrego. 
    
    })
    
    //recibimos del cliente el id del producto a eliminar
    socket.on('deleteProduct', async data => {
        await pManager.deleteProduct(data); //eliminamos el producto
        const updateProducts = await pManager.getProducts(); //obtenemos la lista actualizada con el producto eliminado
        socket.emit('updatedProducts', updateProducts ); //le enviamos al cliente la lista actualizada
    })

})



//websockets para el chat:

socketServer.on('connection', async (socket) => {

    console.log("nuevo cliente conectado 2")


    //recibimos el nombre del usuario que se registro:
    socket.on('authenticated', data => {
        console.log(data)
        socket.broadcast.emit('newUserConnected', data);
    })


    //recibimos el usuario con su mensaje
    socket.on('message', async data => {
        console.log(data)
        const addMessage = await mManager.addMessages(data); //agregamos el mensaje del usuario a la base de datos. 
        const messages = await mManager.getMessages(); //obtenemos todos los mensajes de la base de datos.
        socket.emit('messageLogs', messages); //enviamos al cliente la lista de todos los mensajes (array).
    })
});

