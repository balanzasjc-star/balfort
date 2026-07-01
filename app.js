// --- Estado Inicial ---
let indiceEditando = null;
let productoEditando = null;
let inventario = JSON.parse(localStorage.getItem('bd_inventario')) || [];
let clientes = JSON.parse(localStorage.getItem('bd_clientes')) || []; // <--- AGREGA ESTO
let clienteEditandoIndex = null;

let configuracion = JSON.parse(localStorage.getItem('app_config')) || {
    modelos: ["Pitillo 1 boton", "Pitillo 3 botones", "Pitillo fajero", "Skyni", "Palaso"],
    colores: ["Azul", "Amarillo", "Verde", "Negro", "Blanco", "Rosado"],
    tallas: ["28", "30", "32", "34", "36"],
    btnNombres: { compras: "Productos", ventas: "Ventas", reporte: "Inventario", historial: "Historial", rotulacion: "Rotulación" }
};

// --- Inicialización ---
window.onload = () => aplicarNombresBotones();

function aplicarNombresBotones() {
    for (let key in configuracion.btnNombres) {
        const btn = document.getElementById('btn-' + key);
        if (btn) btn.innerText = configuracion.btnNombres[key];
    }
}

// --- Funciones de Configuración ---
function generarOpciones(tipo) {
    return configuracion[tipo].map(item => `<option value="${item}">${item}</option>`).join('');
}

function guardarConfig() {
    // Guardar listas
    configuracion.modelos = document.getElementById('cfg_modelos').value.split(',').map(s => s.trim()).filter(s => s !== "");
    configuracion.colores = document.getElementById('cfg_colores').value.split(',').map(s => s.trim()).filter(s => s !== "");
    configuracion.tallas = document.getElementById('cfg_tallas').value.split(',').map(s => s.trim()).filter(s => s !== "");
    
    // Guardar nuevos nombres de botones
    for (let key in configuracion.btnNombres) {
        const nuevoNombre = document.getElementById('cfg_btn_' + key).value;
        configuracion.btnNombres[key] = nuevoNombre;
    }

    localStorage.setItem('app_config', JSON.stringify(configuracion));
    alert("Configuración guardada.");
    location.reload(); // Recarga para aplicar los nombres en el menú
}

// --- Gestión de Inventario ---
function registrar(tipo) {
    const modelo = document.getElementById('modelo').value;
    const color = document.getElementById('color').value;
    const talla = document.getElementById('talla').value;
    const precio = parseFloat(document.getElementById('precio').value) || 0;
    let cantidad = parseInt(document.getElementById('cant').value) || 0;
    const fecha = new Date().toLocaleDateString();

    // Validación básica
    if (!modelo || !color || !talla || cantidad <= 0 || precio <= 0) {
        return alert("Por favor, completa todos los campos correctamente.");
    }

    // Asegurar que tipo tenga un valor válido
    const tipoRegistro = tipo || 'compras'; 
    if (tipoRegistro === 'ventas') cantidad = -cantidad;

    inventario.push({ modelo, color, talla, cantidad, precio, fecha, tipo: tipoRegistro });
    localStorage.setItem('bd_inventario', JSON.stringify(inventario));
    alert("Registrado correctamente");
    
    // Si estás dentro de un módulo, recárgalo
    if (document.getElementById('moduloActivo').dataset.modulo) {
        cargarModulo(document.getElementById('moduloActivo').dataset.modulo);
    }
}

function guardarRotuloComoCliente() {
    const rotulo = document.getElementById('capturaRotulo');
    const inputs = rotulo.querySelectorAll('input');
    const datosCliente = {};
    
    inputs.forEach(input => {
        const label = input.parentElement.querySelector('strong').innerText.replace(':', '');
        datosCliente[label] = input.value;
    });

    if (clienteEditandoIndex !== null) {
        // Si estamos editando, reemplazamos el registro
        clientes[clienteEditandoIndex] = datosCliente;
        clienteEditandoIndex = null; // Reseteamos
    } else {
        // Si es nuevo, lo añadimos
        clientes.push(datosCliente);
    }

    localStorage.setItem('bd_clientes', JSON.stringify(clientes));
    alert("Guardado correctamente.");
    volver(); // Volvemos al menú o a la vista principal
}
// --- 1. Corrige actualizarTabla ---
// --- 1. Corregido: Actualizar Tabla (Inventario) ---
function actualizarTabla() {
    // 1. Obtener valores de los filtros
    const filtroMod = document.getElementById('filtro_modelo')?.value || "";
    const filtroCol = document.getElementById('filtro_color')?.value || "";
    const filtroTal = document.getElementById('filtro_talla')?.value || "";

    const res = {};
    inventario.forEach((i) => {
        const k = `${i.modelo}-${i.color}-${i.talla}`;
        if (!res[k]) res[k] = { modelo: i.modelo, color: i.color, talla: i.talla, total: 0 };
        res[k].total += i.cantidad;
    });

    // 2. Filtrar los resultados
    const datosFiltrados = Object.values(res).filter(i => {
        return (filtroMod === "" || i.modelo === filtroMod) &&
               (filtroCol === "" || i.color === filtroCol) &&
               (filtroTal === "" || i.talla === filtroTal);
    });

    // 3. Renderizar tabla con datos filtrados
    let html = `<table class="w-full border text-center text-sm"><tr class="bg-gray-200"><th>Modelo</th><th>Color</th><th>Talla</th><th>Stock</th></tr>`;

    datosFiltrados.forEach(i => {
        const colorStock = i.total < 0 ? 'text-red-600 font-bold' : 'font-bold';
        html += `<tr class="border-b">
            <td>${i.modelo}</td><td>${i.color}</td><td>${i.talla}</td>
            <td class="${colorStock}">${i.total}</td>
        </tr>`;
    });
    
    const contenedor = document.getElementById('listaStock');
    if (contenedor) contenedor.innerHTML = html + `</table>`;
}

// --- 2. Corregido: Historial con botón volver y borrado funcional ---
function guardarEdicionHistorial() {
    const nuevaCant = parseInt(document.getElementById('edit_cant').value);
    
    if (isNaN(nuevaCant)) return alert("Por favor, ingresa un número válido");

    // Obtenemos el signo original (ventas = negativo, otros = positivo)
    const signo = inventario[indiceEditando].cantidad < 0 ? -1 : 1;
    
    // Actualizamos el inventario
    inventario[indiceEditando].cantidad = nuevaCant * signo;
    
    // Guardamos y refrescamos
    localStorage.setItem('bd_inventario', JSON.stringify(inventario));
    document.getElementById('modalEdicion').classList.add('hidden');
    cargarHistorial(); // Esto recarga la tabla y vuelve a mostrar el botón "Volver"
}

// Asegúrate de tener esta función para que el botón de corregir funcione:
function prepararEdicion(index) {
    indiceEditando = index; 
    const item = inventario[index];
    // Rellena tu modal con los datos del item
    document.getElementById('edit_cant').value = Math.abs(item.cantidad);
    document.getElementById('modalEdicion').classList.remove('hidden');
}

// Función de borrado
function borrarItem(index) {
    if (confirm("¿Estás seguro de eliminar este registro del historial?")) {
        inventario.splice(index, 1);
        localStorage.setItem('bd_inventario', JSON.stringify(inventario));
        cargarHistorial(); // Recarga la vista para actualizar los botones y la lista
    }
}

// --- 4. Corregido: Abrir Modal ---
function abrirModal(modelo, color, talla) {
    productoEditando = { modelo, color, talla };
    document.getElementById('modalEdicion').classList.remove('hidden');
}

function guardarEdicion() {
    const nuevaCant = parseInt(document.getElementById('edit_cant').value);
    if (isNaN(nuevaCant)) return alert("Ingresa un número válido");

    // Ajuste simple: agregamos un registro de ajuste para que el total cuadre
    inventario.push({ 
        modelo: productoEditando.modelo, 
        color: productoEditando.color, 
        talla: productoEditando.talla, 
        cantidad: nuevaCant, 
        precio: 0, 
        fecha: new Date().toLocaleDateString(), 
        tipo: 'ajuste' 
    });
    
    localStorage.setItem('bd_inventario', JSON.stringify(inventario));
    document.getElementById('modalEdicion').classList.add('hidden');
    actualizarTabla();
}
// 1. Función corregida de Historial (con botón volver, editar y borrar)
function cargarHistorial() {
    let totalCompras = 0, totalVentas = 0;
    inventario.forEach(i => {
        const subtotal = i.cantidad * i.precio;
        if (i.tipo === 'ventas') totalVentas += Math.abs(subtotal);
        else totalCompras += Math.abs(subtotal);
    });

    let filas = "";
    inventario.forEach((i, index) => {
        const total = i.cantidad * i.precio;
        filas += `<tr class="border-b ${i.tipo === 'ventas' ? 'text-red-600 font-bold' : ''}">
            <td>${i.fecha}</td><td>${i.modelo}</td><td>${i.color}</td><td>${i.talla}</td><td>${i.tipo}</td>
            <td>${Math.abs(i.cantidad)}</td><td>S/ ${i.precio.toFixed(2)}</td><td>S/ ${Math.abs(total).toFixed(2)}</td>
            <td>
                <button onclick="prepararEdicion(${index})" class="mr-2">✏️</button>
                <button onclick="borrarItem(${index})">🗑️</button>
            </td>
        </tr>`;
    });

    document.getElementById('contenidoDinamico').innerHTML = `
        <button onclick="volver()" class="bg-gray-800 text-white px-4 py-2 rounded mb-6">← Volver al Menú</button>
        <h2 class="text-xl font-bold mb-4">Historial</h2>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="p-4 bg-blue-100 rounded text-center"><h3 class="font-bold">Inversión</h3><p class="text-xl">S/ ${totalCompras.toFixed(2)}</p></div>
            <div class="p-4 bg-green-100 rounded text-center"><h3 class="font-bold">Ventas</h3><p class="text-xl">S/ ${totalVentas.toFixed(2)}</p></div>
        </div>
        <div class="flex gap-2 mb-4">
            <button onclick="borrarTodo()" class="flex-1 bg-red-600 text-white py-2 rounded">🗑️ Borrar Todo</button>
            <button onclick="descargarExcel()" class="flex-1 bg-green-700 text-white py-2 rounded">📊 Descargar Excel</button>
        </div>
        <table class="w-full border text-center text-sm">${filas}</table>`;
}

// 2. Función Borrar Todo
function borrarTodo() {
    if (confirm("¿Estás seguro de borrar TODO el historial? Esta acción no se puede deshacer.")) {
        inventario = [];
        localStorage.setItem('bd_inventario', JSON.stringify(inventario));
        cargarHistorial();
    }
}

// 3. Funciones de Edición (Debe estar fuera de otras funciones)
function prepararEdicion(index) {
    indiceEditando = index;
    const item = inventario[index];

    // Cargar los selectores con las opciones de tu configuración global
    document.getElementById('edit_modelo').innerHTML = generarOpciones('modelos');
    document.getElementById('edit_color').innerHTML = generarOpciones('colores');
    document.getElementById('edit_talla').innerHTML = generarOpciones('tallas');

    // Llenar datos
    document.getElementById('edit_modelo').value = item.modelo;
    document.getElementById('edit_color').value = item.color;
    document.getElementById('edit_talla').value = item.talla;
    document.getElementById('edit_cant').value = Math.abs(item.cantidad);
    document.getElementById('edit_precio').value = item.precio;

    document.getElementById('modalEdicion').classList.remove('hidden');
}

function guardarEdicionHistorial() {
    const nuevaCant = parseInt(document.getElementById('edit_cant').value);
    const nuevoPrecio = parseFloat(document.getElementById('edit_precio').value);

    if (isNaN(nuevaCant) || isNaN(nuevoPrecio)) return alert("Datos inválidos");

    const signo = inventario[indiceEditando].cantidad < 0 ? -1 : 1;

    inventario[indiceEditando] = {
        ...inventario[indiceEditando],
        modelo: document.getElementById('edit_modelo').value,
        color: document.getElementById('edit_color').value,
        talla: document.getElementById('edit_talla').value,
        cantidad: nuevaCant * signo,
        precio: nuevoPrecio
    };

    localStorage.setItem('bd_inventario', JSON.stringify(inventario));
    document.getElementById('modalEdicion').classList.add('hidden');
    cargarHistorial(); // Refresca la tabla
}

// --- Funciones de Descarga ---
function descargarExcel() {
    let html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><table border="1"><tr><th>Fecha</th><th>Modelo</th><th>Color</th><th>Talla</th><th>Tipo</th><th>Cant</th><th>Precio</th><th>Total</th></tr>`;
    inventario.forEach(i => {
        html += `<tr><td>${i.fecha}</td><td>${i.modelo}</td><td>${i.color}</td><td>${i.talla}</td><td>${i.tipo}</td><td>${Math.abs(i.cantidad)}</td><td>${i.precio}</td><td>${Math.abs(i.cantidad*i.precio)}</td></tr>`;
    });
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Historial.xls";
    link.click();
}

function descargarInventarioExcel() {
    const res = {};
    inventario.forEach(i => {
        const k = `${i.modelo}-${i.color}-${i.talla}`;
        if (!res[k]) res[k] = { ...i, total: 0 };
        res[k].total += i.cantidad;
    });
    let html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><table border="1"><tr><th>Modelo</th><th>Color</th><th>Talla</th><th>Stock</th></tr>`;
    Object.values(res).forEach(i => {
        html += `<tr><td>${i.modelo}</td><td>${i.color}</td><td>${i.talla}</td><td>${i.total}</td></tr>`;
    });
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Inventario_Actual.xls";
    link.click();
}

// --- Módulos ---
// --- Módulos (Cargador Principal) ---
function cargarModulo(id) {
    document.getElementById('menuPrincipal').classList.add('hidden');
    document.getElementById('moduloActivo').classList.remove('hidden');
    document.getElementById('moduloActivo').dataset.modulo = id;
    
    const cont = document.getElementById('contenidoDinamico');
    // Botón de retorno estándar inyectado dinámicamente
    const btnVolver = `<button type="button" onclick="volver()" class="bg-gray-800 text-white px-4 py-2 rounded mb-6 print-hidden">← Volver al Menú</button>`;

   if (id === 'reporte') { 
    cont.innerHTML = `${btnVolver}
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Inventario Actual</h2>
            <button onclick="descargarInventarioExcel()" class="bg-green-700 text-white px-4 py-2 rounded font-bold">📊 Descargar Excel</button>
        </div>
        
        <div class="grid grid-cols-3 gap-2 mb-4 bg-gray-100 p-2 rounded">
            <select id="filtro_modelo" onchange="actualizarTabla()" class="p-1 border rounded"><option value="">Todos Modelos</option>${generarOpciones('modelos')}</select>
            <select id="filtro_color" onchange="actualizarTabla()" class="p-1 border rounded"><option value="">Todos Colores</option>${generarOpciones('colores')}</select>
            <select id="filtro_talla" onchange="actualizarTabla()" class="p-1 border rounded"><option value="">Todas Tallas</option>${generarOpciones('tallas')}</select>
        </div>

        <div id="listaStock"></div>`; 
    setTimeout(actualizarTabla, 100); 
}
    else if (id === 'clientes') {
    let filas = clientes.map((c, index) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-2 border-r">${c.FECHA || ''}</td>
            <td class="p-2 border-r font-medium text-left">${c.NOMBRES || ''} ${c.APELLIDOS || ''}</td>
            <td class="p-2 border-r">${c.DNI || ''}</td>
            <td class="p-2 border-r">${c.CELULAR || ''}</td>
            <td class="p-2 border-r">${c.PAGO || ''}</td>
            <td class="p-2 border-r">${c.AGENCIA || ''}</td>
            <td class="p-2 border-r">${c.DESTINO || ''}</td>
            <td class="p-2 border-r">${c.OFICINA || ''}</td>
            <td class="p-2 border-r">${c.MODELO || ''}</td>
            <td class="p-2 border-r">${c.COLOR || ''}</td>
            <td class="p-2 border-r">${c.TALLA || ''}</td>
            <td class="p-2 border-r">${c.CANTIDAD || ''}</td>
            <td class="p-2">
                <button onclick="editarCliente(${index})" class="text-blue-600 mr-2">✏️</button>
                <button onclick="borrarCliente(${index})" class="text-red-600 font-bold">🗑️</button>
            </td>
        </tr>
    `).join('');

    cont.innerHTML = `${btnVolver}
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Base de Datos de Clientes</h2>
            <button onclick="descargarClientesExcel()" class="bg-green-700 text-white px-4 py-2 rounded font-bold">📊 Excel</button>
        </div>
        <div class="overflow-x-auto shadow-md rounded-lg">
            <table class="w-full text-center text-sm border-collapse bg-white">
                <thead class="bg-gray-800 text-white">
                    <tr>
                        <th class="p-2">Fecha</th><th class="p-2">Nombre</th><th class="p-2">DNI</th>
                        <th class="p-2">Cel</th><th class="p-2">Pago</th><th class="p-2">Agencia</th>
                        <th class="p-2">Destino</th><th class="p-2">Oficina</th><th class="p-2">Modelo</th>
                        <th class="p-2">Color</th><th class="p-2">Talla</th><th class="p-2">Cant</th>
                        <th class="p-2">Acción</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;
}
    else if (id === 'historial') { 
        cont.innerHTML = `${btnVolver}`;
        cargarHistorial(); 
    } 
    else if (id === 'configuracion') {
    cont.innerHTML = `${btnVolver}
        <h2 class="text-xl font-bold mb-4">⚙️ Configuración</h2>
        
        <h3 class="font-bold mt-4">Nombres de Botones:</h3>
        <div class="grid grid-cols-2 gap-2 mb-4">
            ${Object.entries(configuracion.btnNombres).map(([key, val]) => `
                <div>
                    <label class="text-xs uppercase">${key}</label>
                    <input id="cfg_btn_${key}" value="${val}" class="w-full border p-1 rounded">
                </div>
            `).join('')}
        </div>

        <label class="block font-bold">Modelos:</label>
        <textarea id="cfg_modelos" class="w-full border p-2 mb-2">${configuracion.modelos.join(', ')}</textarea>
        <label class="block font-bold">Colores:</label>
        <textarea id="cfg_colores" class="w-full border p-2 mb-2">${configuracion.colores.join(', ')}</textarea>
        <label class="block font-bold">Tallas:</label>
        <textarea id="cfg_tallas" class="w-full border p-2 mb-4">${configuracion.tallas.join(', ')}</textarea>
        <button onclick="guardarConfig()" class="bg-blue-600 text-white w-full py-2 rounded">Guardar Cambios</button>`;
        }
    else if (id === 'rotulacion') {
    const fechaHoy = new Date().toLocaleDateString('es-PE');
    const c = clienteEditandoIndex !== null ? clientes[clienteEditandoIndex] : {};

    cont.innerHTML = `
    <style>
        .rotulo-estilo { font-family: 'Cambria', serif !important; }
    </style>
    ${btnVolver}
    <div id="capturaRotulo" class="rotulo-estilo border-2 border-black p-6 border-dashed bg-white w-full">
        <h2 class="text-2xl font-bold uppercase mb-6 text-center">📦 ${clienteEditandoIndex !== null ? 'Editar Rótulo' : 'BRISA JEANS'} 📦</h2>
        <div class="grid grid-cols-2 gap-x-10 gap-y-6 text-lg">
            ${['FECHA', 'DESTINO', 'NOMBRES', 'OFICINA', 'APELLIDOS', 'MODELO', 'DNI', 'COLOR', 'CELULAR', 'TALLA', 'PAGO', 'CANTIDAD', 'AGENCIA'].map(label => {
                const valor = c[label] || (label === 'FECHA' ? fechaHoy : '');
                
                // Definimos si el campo debe ser numérico
                const esNumerico = (label === 'DNI' || label === 'CELULAR' || label === 'CANTIDAD');
                
                return `<p><strong>${label}:</strong> 
                    <input value="${valor}" 
                           class="border-b-2 border-gray-400 w-full outline-none"
                           style="${!esNumerico ? 'text-transform: uppercase;' : ''}"
                           ${esNumerico ? 'type="number" oninput="this.value = this.value.replace(/[^0-9]/g, \'\')"' : ''}>
                </p>`;
            }).join('')}
        </div>
    </div>
    <div class="flex gap-4 mt-6 print-hidden">
        <button onclick="window.print()" class="flex-1 bg-gray-800 text-white py-3 font-bold hover:bg-black">IMPRIMIR</button>
        <button onclick="descargarWord()" class="flex-1 bg-blue-700 text-white py-3 font-bold hover:bg-blue-900">DESCARGAR WORD</button>
        <button onclick="guardarRotuloComoCliente()" class="flex-1 bg-green-600 text-white py-3 font-bold hover:bg-green-700">GUARDAR CAMBIOS</button>
    </div>`;
}
    else {
        // --- INICIO DEL REEMPLAZO ---
        // 1. Capturamos los valores actuales antes de que se borren
        const valModelo = document.getElementById('modelo') ? document.getElementById('modelo').value : '';
        const valColor = document.getElementById('color') ? document.getElementById('color').value : '';
        const valTalla = document.getElementById('talla') ? document.getElementById('talla').value : '';
        const valCant = document.getElementById('cant') ? document.getElementById('cant').value : '';
        const valPrecio = document.getElementById('precio') ? document.getElementById('precio').value : '';

        // 2. Insertamos el HTML
        cont.innerHTML = `${btnVolver}
            <h2 class="text-xl font-bold mb-4 capitalize">${id}</h2>
            <select id="modelo" class="w-full border p-2 mb-2">${generarOpciones('modelos')}</select>
            <select id="color" class="w-full border p-2 mb-2">${generarOpciones('colores')}</select>
            <select id="talla" class="w-full border p-2 mb-2">${generarOpciones('tallas')}</select>
            
            <input id="cant" type="number" placeholder="Cantidad" class="w-full border p-2 mb-2" oninput="calcularTotal()">
            <input id="precio" type="number" placeholder="Precio (S/)" class="w-full border p-2 mb-4" oninput="calcularTotal()">
            
            <div class="text-xl font-bold mb-4 text-center">Total: S/ <span id="displayTotal">0.00</span></div>
            
            <button onclick="registrar('${id}')" class="bg-blue-600 text-white w-full py-2 rounded">Guardar ${id}</button>`;

        // 3. Restauramos los valores y recalculamos el total si había datos
        if (valModelo) document.getElementById('modelo').value = valModelo;
        if (valColor) document.getElementById('color').value = valColor;
        if (valTalla) document.getElementById('talla').value = valTalla;
        if (valCant) document.getElementById('cant').value = valCant;
        if (valPrecio) {
            document.getElementById('precio').value = valPrecio;
            calcularTotal(); // Esto asegura que el total se vea reflejado al volver
        }
        // --- FIN DEL REEMPLAZO ---
    }

}
function editarCliente(index) {
    clienteEditandoIndex = index; // Guardamos el índice globalmente
    cargarModulo('rotulacion');   // Abrimos el módulo
}
// --- FUNCIÓN VOLVER ---
function volver() {
    console.log("Intentando volver al menú...");
    
    const menu = document.getElementById('menuPrincipal');
    if (menu) menu.classList.remove('hidden');
    
    const activo = document.getElementById('moduloActivo');
    if (activo) activo.classList.add('hidden');
    
    const cont = document.getElementById('contenidoDinamico');
    if (cont) cont.innerHTML = '';
}
function descargarWord() {
    const rotulo = document.getElementById('capturaRotulo');
    const inputs = rotulo.querySelectorAll('p');
    let filasHtml = '';
    for (let i = 0; i < inputs.length; i += 2) {
        const item1 = inputs[i];
        const item2 = inputs[i + 1];
        filasHtml += `<tr>
            <td style="width: 50%; padding: 8px; vertical-align: top;"><strong>${item1.querySelector('strong').innerText}</strong><br/>${item1.querySelector('input').value}</td>
            <td style="width: 50%; padding: 8px; vertical-align: top;">${item2 ? `<strong>${item2.querySelector('strong').innerText}</strong><br/>${item2.querySelector('input').value}` : ''}</td>
        </tr>`;
    }
    const htmlContent = `<html><body><div style="font-family:Arial;"><h2>📦 Rótulo de Encomienda</h2><table style="width:100%; border-collapse:collapse;">${filasHtml}</table></div></body></html>`;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rotulo_encomienda.doc';
    link.click();
    
}
// --- ESTO DEBE IR AL FINAL DE TODO, FUERA DE CUALQUIER OTRA FUNCIÓN ---
function calcularTotal() {
    // Obtenemos los valores de los inputs
    const cantInput = document.getElementById('cant');
    const precioInput = document.getElementById('precio');
    const display = document.getElementById('displayTotal');

    // Calculamos el total si existen los elementos
    if (cantInput && precioInput && display) {
        const cantidad = parseFloat(cantInput.value) || 0;
        const precio = parseFloat(precioInput.value) || 0;
        const total = cantidad * precio;
        
        // Actualizamos el texto en pantalla
        display.innerText = total.toFixed(2);
    }
}
function borrarCliente(index) {
    if (confirm("¿Eliminar cliente?")) {
        clientes.splice(index, 1);
        localStorage.setItem('bd_clientes', JSON.stringify(clientes));
        cargarModulo('clientes');
    }
}
// Función para descargar clientes en Excel
function descargarClientesExcel() {
    let html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><table border="1">
        <tr><th>Fecha</th><th>Nombre</th><th>DNI</th><th>Celular</th><th>Pago</th><th>Agencia</th><th>Destino</th><th>Oficina</th><th>Modelo</th><th>Color</th><th>Talla</th><th>Cantidad</th></tr>`;
    
    clientes.forEach(c => {
        html += `<tr><td>${c.FECHA}</td><td>${c.NOMBRES} ${c.APELLIDOS}</td><td>${c.DNI}</td><td>${c.CELULAR}</td><td>${c.PAGO}</td><td>${c.AGENCIA}</td><td>${c.DESTINO}</td><td>${c.OFICINA}</td><td>${c.MODELO}</td><td>${c.COLOR}</td><td>${c.TALLA}</td><td>${c.CANTIDAD}</td></tr>`;
    });
    
    html += `</table></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Lista_Clientes.xls";
    link.click();
}
