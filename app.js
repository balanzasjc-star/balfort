<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Sistema de Gestión Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>@media print { .print-hidden { display: none !important; } }</style>
</head>
<body class="bg-slate-900 min-h-screen p-4 md:p-8">
    <h1 class="text-white text-3xl font-bold text-center mb-10">Sistema de Gestión</h1>

    <div id="menuPrincipal" class="grid grid-cols-2 md:grid-cols-6 gap-6 max-w-5xl mx-auto">
        <button id="btn-compras" onclick="cargarModulo('compras')" class="bg-blue-600 p-6 rounded-xl text-white font-bold shadow-lg">Productos</button>
        <button id="btn-ventas" onclick="cargarModulo('ventas')" class="bg-green-600 p-6 rounded-xl text-white font-bold shadow-lg">Ventas</button>
        <button id="btn-historial" onclick="cargarModulo('historial')" class="bg-orange-600 p-6 rounded-xl text-white font-bold shadow-lg">Historial</button>
        <button id="btn-reporte" onclick="cargarModulo('reporte')" class="bg-yellow-600 p-6 rounded-xl text-white font-bold shadow-lg">Inventario</button>
        <button id="btn-rotulacion" onclick="cargarModulo('rotulacion')" class="bg-purple-600 p-6 rounded-xl text-white font-bold shadow-lg">Rotulación</button>
        <button id="btn-rotulacion" onclick="cargarModulo('clientes')" class="bg-purple-600 p-6 rounded-xl text-white font-bold shadow-lg">Clientes</button>
        <button onclick="cargarModulo('configuracion')" class="bg-gray-600 p-6 rounded-xl text-white font-bold shadow-lg">⚙️ Config</button>
    </div>

    <div id="moduloActivo" class="mt-10 bg-white p-8 rounded-2xl max-w-4xl mx-auto hidden shadow-2xl">
        <div id="contenidoDinamico"></div>
    </div>

    <div id="modalEdicion" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex justify-center items-center p-4 z-50">
        <div class="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h2 class="text-lg font-bold mb-4">Corregir Registro</h2>
            
            <label class="text-sm font-bold">Modelo:</label>
            <select id="edit_modelo" class="w-full border p-2 mb-2 rounded"></select>
            
            <label class="text-sm font-bold">Color:</label>
            <select id="edit_color" class="w-full border p-2 mb-2 rounded"></select>
            
            <label class="text-sm font-bold">Talla:</label>
            <select id="edit_talla" class="w-full border p-2 mb-2 rounded"></select>
            
            <label class="text-sm font-bold">Cantidad:</label>
            <input type="number" id="edit_cant" class="w-full border p-2 mb-2 rounded">
            
            <label class="text-sm font-bold">Precio:</label>
            <input type="number" id="edit_precio" class="w-full border p-2 mb-4 rounded">
            
            <div class="flex gap-2">
                <button onclick="guardarEdicionHistorial()" class="flex-1 bg-blue-600 text-white py-2 rounded">Guardar</button>
                <button onclick="document.getElementById('modalEdicion').classList.add('hidden')" class="flex-1 bg-gray-400 text-white py-2 rounded">Cancelar</button>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
    <script>
        window.onload = aplicarNombresBotones;
    </script>
</body>
</html>
