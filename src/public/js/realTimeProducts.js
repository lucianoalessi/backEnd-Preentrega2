// Obtener referencia con datos del usuario
let userId = document.getElementById('user-id').textContent;
let userRole = document.getElementById('user-role').textContent;

// Crear una instancia de socket.io cliente
const socketCliente = io();

// Escuchar eventos "productos" enviados por el servidor, en el cual recibiremos la lista de productos actualizada. 

socketCliente.on("productos", (products) => {
  console.log(products);
  updateProductList(products);
});


// Función para actualizar la lista de productos en la página web en 'localhost:8080/realtimeproducts'

const updateProductList = (products) => {
  let productListContainer = document.getElementById("products-list-container");
  let productsList = '<div class="row">'; // Inicia una nueva fila

  // Itera a través de la lista de productos y crea una tarjeta HTML para cada uno
  products.forEach((product) => {
    productsList += `
    <div class="col-md-4 mb-4"> <!-- Cada producto ocupará 4 columnas en dispositivos medianos y grandes -->
      <div class="card h-100 shadow-sm"> <!-- Añade sombra a la tarjeta -->
        <div class="card-body">
          <h4 class="card-title">${product.title}</h4>
          <h6 class="card-subtitle mb-2 text-muted">Id: ${product._id}</h6>
          <p class="card-text">${product.description}</p>
          <h5 class="card-text">Precio: ${product.price} USD</h5>
          <h5 class="card-text">Stock: ${product.stock}</h5>
          <h6 class="card-text">Owner: ${product.owner}</h6>
        </div>
        <div class="card-footer">
          <a href="#" class="btn btn-primary">Buy Now</a>
        </div>
      </div>
    </div>`; // Cierra la columna del producto
  });

  productsList += '</div>'; // Cierra la fila

  // Actualiza el contenido del contenedor de la lista de productos en la página.
  productListContainer.innerHTML = productsList;
}

//#AGREGAR UN PRODUCTO
// Obtener referencia al formulario y agregar un evento para cuando se envíe
let form = document.getElementById("formProduct");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // Evitar que el formulario recargue la página

  // Obtener valores de los campos del formulario
  let title = form.elements.title.value;
  let description = form.elements.description.value;
  let stock = form.elements.stock.value;
  let thumbnail = form.elements.thumbnail.value;
  let price = form.elements.price.value;
  let code = form.elements.code.value;
  let category = form.elements.category.value;
  
  const product = {
    title,
    description,
    stock,
    thumbnail,
    price,
    code,
    category,    
  }

  // Emitir un evento "addProduct" al servidor con la información del nuevo producto
  socketCliente.emit("addProduct", {product , userId});
});

// Escuchar el evento de producto agregado
socketCliente.on('productAdded', () => {
  alert('Producto Agregado Correctamente');
  form.reset(); // Restablecer los campos del formulario
});



//#ACTUALIZAR UN PRODUCTO

// Obtener referencia al formulario y agregar un evento para cuando se envíe
let updateForm = document.getElementById("updateForm");
updateForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Evitar que el formulario recargue la página

  // Obtener valores de los campos del formulario
  let _id = updateForm.elements.productID.value
  let title = updateForm.elements.title.value;
  let description = updateForm.elements.description.value;
  let stock = updateForm.elements.stock.value;
  let thumbnail = updateForm.elements.thumbnail.value;
  let price = updateForm.elements.price.value;
  let code = updateForm.elements.code.value;
  let category = updateForm.elements.category.value;

  // Crear un objeto solo con las propiedades definidas
  let productData = {};
  if (_id) productData._id = _id;
  if (title) productData.title = title;
  if (description) productData.description = description;
  if (stock) productData.stock = stock;
  if (thumbnail) productData.thumbnail = thumbnail;
  if (price) productData.price = price;
  if (code) productData.code = code;
  if (category) productData.category = category;

  // Crear un objeto con los datos del usuario
  let userData = {
    _id: userId,
    role: userRole
  }

  // Emitir un evento "updateProduct" al servidor con la información del producto y del usuario
  socketCliente.emit("updateProduct", productData , userData);
});


// Escuchar el evento de producto actualizado
socketCliente.on('productUpdated', () => {
  alert('Producto Actualizado');
  updateForm.reset(); // Restablecer los campos del formulario
});


//#DELETE PRODUCT
// Obtener referencia al botón de eliminación
const deleteButton =  document.getElementById('delete-btn');

// Agregar un evento para cuando se haga clic en el botón de eliminación
deleteButton.addEventListener('click', () => {

  // obtenemos el input donde se ingresa el id
  const productId = document.getElementById('productID-delete').value;
  // Crear un objeto con los datos del usuario
  let userData = {
    _id: userId,
    role: userRole
  } 
  //enviamos el valor al servidor
  socketCliente.emit('deleteProduct' , productId , userData);
  productId = "" // Restablecer el valor del input 
});

// Escuchar el evento de producto eliminado
socketCliente.on('productDeleted', () => {
  alert('Producto eliminado correctamente!');
});


//ALERTAS DE ERRORES:

  socketCliente.on('error', (errorMessage) => {
    alert(errorMessage);
  });



//Escuchar eventos "updatedProducts" enviados por el servidor después de una actualización

socketCliente.on("updatedProducts", (obj) => {
  updateProductList(obj); // Llama a la función para actualizar la lista de productos en la página
});