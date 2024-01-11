 /*
	Plugin del funcionamiento visual del software
	El cual integra cada vendor de manera practica y limpia 

	El cual maneja validaciones, mensajes notify, sweet2...

	Uso del tooltip de manera practica 

	Autor = Armando Rojas - UNEFA 2017 

*/



 

/*Utilizacion de Modal con SweetAlert2*/
function modalImagen(texto){
			swal({
					  title: texto, timer: 5000,
					  html: $('<div>').addClass('some-class').text('by: Armando Rojas.'),
					  animation: true, customClass: 'animated tada',
					  imageUrl: 'images/logo.gif',
					  imageWidth: 300, imageHeight: 200,

			});
		}
//------------------------------------------


/*Utilizacion de Alert con notify */
	// { mensaje, tipo }
	function mensajeNotify(arreglo){
		
		let tiempo = null;
		
		if (!arreglo['mensaje']) arreglo['mensaje'] = 'NULL';

		if (!arreglo['tipo']) arreglo['tipo'] = 'success';

		switch(arreglo['tipo']){

			case 'warning': tiempo = 0.1;   break;
			default: tiempo = 500; break;
		}

		$.notify(
			{
			  icon: 'glyphicon glyphicon-remove',
			  message: "<strong >"+arreglo['mensaje']+"</strong>"
			},{
				type: arreglo['tipo'], delay: tiempo,
				placement: { from: "top",align: "center"},
				showProgressbar: false,
				allow_duplicates: false,
				animate: {
					enter: 'animated swing', exit: 'animated zoomOut'
				},
			}
		);
	}

function mensajeSiNo( arreglo , funcion ){

swal({
  title: arreglo['titulo'],
  text: arreglo['contenido'],
  type: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Si',
  cancelButtonText: 'No'
}).then((result) => {
  if (result.value) {
    swal(
      arreglo['titulo2'],
      arreglo['contenido2'],
      'success'
    );

    
    funcion();
  
  }

});

}


function mensajeOk( arreglo  ){

	swal({
	  title: arreglo['titulo'],
	  text: arreglo['contenido'],
	  type: 'success',
	  confirmButtonColor: '#3085d6',
	  confirmButtonText: 'OK'

	})

}


function mensajeNo( arreglo  ){

	swal({
	  title: arreglo['titulo'],
	  text: arreglo['contenido'],
	  type: 'error',
	  confirmButtonColor: '#3085d6',
	  confirmButtonText: 'OK'

	})

}


function mensajeOk2( arreglo , funcion ){

	swal({
	  title: arreglo['titulo'],
	  text: arreglo['contenido'],
	  type: 'success',
	  confirmButtonColor: '#3085d6',
	  confirmButtonText: 'OK'

	}).then((result) => {
		  if (result.value) {funcion()}  				
	})

}

/*Pie de Pagina*/
function footer(){
	/* Efectos al Footer*/

	

	$("footer").click(function(){

		$("footer").animar("shake")
		
		setTimeout( 
			() =>{window.location.href = 'https://mrrojas.github.io/Portafolio/' }  , 
			1000 
			)

	})

}

//-------------------


//------------------------------------------

/*
	Se requiere bootstrap
	Bootstrap 4 
	y notify.bootstrap.js
*/


//valida email
function verificacorreo(objecto){
		// Expresion regular para validar el correo
		var regex = /[\w-\.]{2,}@([\w-]{2,}\.)*([\w-]{2,}\.)[\w-]{2,4}/;

		    	// Se utiliza la funcion test() nativa de JavaScript
			    if (regex.test(objecto.val().trim())) {
			        return true;//Correo valido
			    }
			    else {
			       	return false;//Invalido
			    }
}

// solo letras 
function soloLetras(objecto){

$(function(){
                  objecto.validCampo('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ');
  	});
 

}
// valida ncik
function soloNick(objecto){

$(function(){
                   objecto.validCampo('abcdefghijklmnopqrstuvwxyz-_.1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ');


  	});
}


//

var mensajeError = function(){ return "Error fatal en el Servidor llamar al 0414-5235969" }



var numeroAleatorio = function() {

	return Math.round(Math.random() * 10)
}

var numeroAleatorio2 = function numeroAleatorio2(inferior,superior){ 
   	var numPosibilidades = superior - inferior 
   	var aleat = Math.random() * numPosibilidades 
   	aleat = Math.round(aleat) 
   	return parseInt(inferior) + aleat 
}

String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, "")}

;(function($){

	$.fn.extend({

		/*Manipulacion de elementos Basicos */

		// efecto de sombra 
			sombra : function(color){
				return this.each(function(){

					if(!color) $(this).css("box-shadow",".1em .1em 1em white"); 
					$(this).css("box-shadow",".1em .1em 1em "+color);

				});
			},

		// desabilitar botones 
			disabled : function(valor){

				return this.each(function(){

					$(this).prop('disabled', valor );
				});
			}, 
		// ocultar y mostrar elementos 

			visibilidad : function(val){

				return this.each(function(){
					
					if(val) $(this).css('display', 'block');
					else $(this).css('display', 'none');

				});
			},
		//----------------------------

		/*Animacion simplificada de WoW.js y Animate.css*/

		// animar un elemento, requiere de wow Js 

			animar: function(tipo){
				return this.each(function(){

					$(this).addClass('WOW '+tipo)

			 		new WOW().init()

			 	

				})
			},

		// animar un boton 
			animarBoton : function(){

				return this.each(function(){
					$(this).mouseover(function(){$(this).animar('shake')});

					$(this).mouseleave(function(){$(this).removeClass('WOW shake')});
				});

			},



		//----------------------------



		/*Validacion de Formularios*/
		
		// no permite copiar y pegar en la caja de texto
		noCopiar: function(){

			return this.each(function(){
				$(this).bind("cut copy paste", function(e){
				e.preventDefault();
				return false;
				});
			});
		},

		// transformar letras a mayuscula 
		mayuscula: function(){

			return this.each(function() {
				$(this).keyup(function(event) {
   					$(this).val($(this).val().toUpperCase());
  				 });
			});
		},

		// validar entrada por teclado
		validCampo: function(b){
			$(this).on(
				{
					keypress:function(a){
					var c=a.which,
					d=a.keyCode,
					e=String.fromCharCode(c).toLowerCase(),
					f=b;
					(-1!=f.indexOf(e)||9==d||37!=c&&37==d||39==d&&39!=c||8==d||46==d&&46!=c)&&161!=c||a.preventDefault();
					
					}
			});
		},

		// validar maximo de cadena 
		
		longitudMax: function(value){

			this.each(function(){
  
				$(this).attr('maxlength', value.toString() );
			});
		},

		// validar campo Vacio
		
		campoVacio: function(id){

			this.each(function(){
  				
  				if($(this).val() == ""  ){
					$(this).sombra("red")
					$(id).html("Campo Vacio")
					localStorage.control =  -1
  				}
  				else{
  					$(this).sombra(false)
  					$(id).html("")
  					

  				}
			});
		},

		// valida longitud del texto
		
		longitud: function(id , cantMax ){

			this.each(function(){
  				

  				if($(this).val().trim().length < cantMax   ){
					$(this).sombra("red")
					$(id).html("Necesita por lo menos "+cantMax+' caracteres')
					localStorage.control =  -1
  				}
  				else{
  					$(this).sombra(false)
  					$(id).html("")
  				
  				}
			});
		},

		comparar: function(objecto , id){

			this.each(function(){
  				
  				if($(this).val() != objecto.val()  ){
					$(this).sombra("red")
					$(id).html('No coinciden con el campo anterior')
					localStorage.control =  -1
  				}
  				else{
  					$(this).sombra(false)
  					$(id).html("")
  				}
			});
		},

		quitarEspacio: function(objecto , id){

			this.each(function(){
  				
  				$(this).val($(this).val().trim())
					
  				
			});
		},

		claveSegura: function(id){

			this.each(function(){
  				
  				let letraM = /[A-Z]+/
  				let letra  = /[a-z]+/
  				let digito = /[0-9]+/
  				let cadena = $(this).val()
  				
  			if( !letraM.test(cadena)  || !digito.test(cadena) || letra.test(cadena) ){
					
					$(this).sombra("red")
					$(id).html('No es una clave segura')
					localStorage.control =  -1
  			}else{
  					$(this).sombra(false)
  					$(id).html("")
  			}
  				
			});
		},

	




		
		//---------------------------------

		

		/* Tooltip con JQuery.flyout.js */

			tooltip : function(arreglo){
				
				return this.each(function(){

					$(this).flyout({
					    title: arreglo['titulo'],
					    content: arreglo['contenido'],
					    html: true,
					    trigger: 'manual'
					  }).mouseover(function() {
					    $(this).flyout('show')
					  }).mouseout(function() {
					    $(this).flyout('hide')
					  });

				});
			},

			tooltip_focus : function(arreglo){
				
				return this.each(function(){

					$(this).flyout({
					    title: arreglo['titulo'],
					    content: arreglo['contenido'],
					    html: true,
					    trigger: 'manual'
					  }).focusin(function() {
					    $(this).flyout('show')
					  }).focusout(function() {
					    $(this).flyout('hide')
					  });

				});
			},
	//--------
	//---------------------------------
	
	/* Sistema de Enrutamiento Armando Rojas */
			ruta: function(url){

				return this.each(function(){

					$(this).click( () => window.location.href = '?url='+url )
				})
			},
		//---------------------------------
		
		/* borrar Area */
			borrar: function(nodo){

				return this.each(function(){

					$(this).click( () => {$(nodo).html("")} );
				});
			},



		//---------------------------------
		//
	

		//---------------------------------
		

		/*Prueba de alerta  */

		//prueba del objecto 

		alerta: function(){
			alert("Testing Alert")
		}

		//------------------------------------


	});
})(jQuery);


/*	Libreria para Mostrar Hora y Fecha */

const miTiempo = {

	hora_local : function(){

		var data = new Date(); // obtener la hora y fecha del sistema
		var hora = data.getHours(); // obtener hora
		var minutos = data.getMinutes(); // obtener minutos 
		var segundos = data.getSeconds(); 

		var regimen = "am"; 
		
		/* Agregar un 0 al izquiera si es necesario*/
		if(hora < 10) hora = "0"+hora.toString();
		if(minutos < 10) minutos = "0"+minutos.toString();
		if(segundos < 10) segundos = "0"+segundos.toString();

		/*Cambiar Regimen y establecer formato 12h*/
		if(hora > 12) {
			regimen = "pm"; 
			hora -= 12; 
		}

			/*Devuelve Formato*/
		return hora+":"+minutos+":"+segundos+regimen;
	}
};

/*
	Expresiones Regulares 
 */

function soloLetras_Numeros(){

	return "{1234567890ABCDEFGHIJKMNLOPQRSTUVWXYZÑabcdefghijklmnopqrstuvwxyzñ}"
}

function soloNumeros(){

	return "{1234567890}"
}

function soloLetras(){

	return "{ABCDEFGHIJKMNLOPQRSTUVWXYZÑab cdefghijklmnopqrstuvwxyzñ}"
}

function soloLetras2(){

	return "{ABCDEFGHIJKMNLOPQRSTUVWXYZÑab cdefghijklmnopq.rstuvwxyzñ}"
}

function soloClaves(){

	return "{1234567890ABCDEFGHIJKMNLOPQRSTUVWXYZÑabcdefghijklmnopqrstuvwxyzñ.$_-@}"
}


 
/* Invocar ayuda */

const videoDeAyuda = ( id ) => {

	let objecto = {}
	// direccion donde se encuentra el archivo json para configurar video y guia 
	let url_archivoJSON = 'config/ayuda.json'
	let url_modal = 'vista/modal/ayuda.php'

	$.getJSON(url_archivoJSON , 
		function(json) {
		
		objecto = json[id]
	});

	$("#ayuda").click(function(event) {

		$.ajax(
			{
				url: url_modal,
				data: {
				
					titulo : objecto.titulo,
					video : objecto.video,
					guia: objecto.guia
				}
			}
			)
		.done(function(request) {
			
			$("#modal_ayuda").html(request)

			$(".close").borrar("#modal_ayuda")
			$(".cerrar").borrar("#modal_ayuda")

			$("#btn1").click( function(){

				$(".modal-backdrop-kajataca")
				.removeClass('modal-backdrop-kajataca')
				.addClass('modal-backdrop-cervezeria')

				$("#btn1").animar("bounceIn")
				

				$(".modal-header")
				.removeClass('fondo_rojo')
				.addClass('bg-primary')

				$("h4").removeClass('color_blanco')

			});

			$("#btn2").click( function(){

				$(".modal-backdrop-cervezeria")
				.removeClass('modal-backdrop-cervezeria')
				.addClass('modal-backdrop-kajataca')

				$("#btn2").animar("bounceIn")
				$("video").animar("bounceIn")

				$(".modal-header")
				.removeClass('bg-primary')
				.addClass('fondo_rojo')

				$("h4").addClass('color_blanco')
			} );

			$("#descargar").click(() => window.open('storage/ayuda/'+objecto.archivo) );



		})
		.fail(function() {
			modalImagen(mensajeError)
		})
		
	});
}

//------------------------


/*Desactivar click derecho*/

function clickDerecho(){

	   document.oncontextmenu = function() {
      return false
   }
   function right(e) {
     
      if (navigator.appName == 'Netscape' && e.which == 3) {
         
         modalImagen(mensajeValidacionClickDerecho())
        
         return false;
      }
      else if (navigator.appName == 'Microsoft Internet Explorer' && event.button==2) {
         alert("NO USES CLICK DERECHO"); //- Si no quieres asustar al usuario que utiliza IE,  entonces quita esta linea...
                        //- Aunque realmente se lo merezca...
      return false;
      }
   return true;
}
document.onmousedown = right;


}




/*
	
	Manejando  AJAX 

 */

const ajax = function ajax( archivo, funcionAnonima , variables   ) {
		

		$.ajax({
			url: archivo,
			type: 'POST',
			data: variables
			})
			.done(function(resp) {
				
				funcionAnonima(resp)

			})
			.fail(function(request) {
				modalImagen(mensajeError)
		})
}


/*Invoca un modal, mostrando resultados de una consulta a bd*/
const consultaIndividual = (val , url) =>{
		
		ajax( url , 		
			function(request){
				$("#modal_consulta").html(request)
				$(".cerrar").borrar("#modal_consulta")
			}, { id: val }  );
}



//------------------------------------------------------


/*Manipulacion de tablas*/

function tablas(){

		$("#dynatable-query-search-").addClass("form-control")
	var dynatable = $('#search-example').dynatable().data('dynatable');

	$("#dynatable-query-search-search-example").tooltip({titulo:"Barra de Busqueda" , contenido:"Escribe un texto y presiona la tecla ENTER para iniciar la busqueda" })
	$("#dynatable-query-search-search-example").css('cursor', 'pointer');
/*
   $('#armando').change( function() {

  var value = $(this).val();
  
  if (value === "") {
    dynatable.queries.remove("nick");
  } else {
    dynatable.queries.add("nick",value);
  }
    dynatable.process();
  } )
*/
}


/* Insertar hora y nombre de Usuario */

function insertar_Hora_NombreDeUsuario(idHora , idNombre_Usuario){
	
	setInterval(function(){

		$(idHora).html(miTiempo.hora_local())

	}, 1000);
	
	setTimeout( () => $(idNombre_Usuario).html(localStorage.nombre)  ,0500)
}


/* Mensaje de Ayuda del sistema */

function mensajesFrontend(url){

	
	
	$.getJSON(url, {}, function(json, textStatus) {
		return json
	});

	
}



//---------------------------------

// mensaje para el logs

var logs = function(eventos){

	ajax('?url=logs', function(resp){},{evento: eventos});
}


/**
 * @param String name
 * @return String
 */
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/*
a función getParameterByName recibe un parámetro del tipo String (cadena de texto) que va a ser 
utilizado para evaluar por medio de una expresión regular que busque todo el contenido entre el 
final de la cadena recibida seguido por un símbolo de igual (=) y el final de la cadena a donde 
buscar (location.search) o hasta encontrar el símbolo «et» también conocido como «ampersand» (&).
 Al final dicho texto encontrado decodificado y devuelto. 
En el remoto caso de no encontrar coincidencias, devolverá una cadena vacía.
 */



 /*Funciones extra para el sistema, como libreria deberia ser elminada*/




 var boton_eliminar = (objecto) =>{


$("#botonEliminar").click(()=>{

mensajeSiNo(
			{ 
				titulo: "¡Alerta!",
				contenido: "¿Estas seguro de eliminarlo?",
				titulo2: "¡Listo!",
				contenido2: "Eliminado"

			},
			() => {


						ajax(localStorage.ajax + objecto.url, (rsp) =>{


							if(rsp.trim() == 1){


								mensajeOk2({titulo : '¡Listo!' , contenido: `Eliminado...` }, 
									 () => {
										window.location.href = localStorage.ajax + objecto.direct
										}
									)
							}
							else 
								mensajeNo({
									titulo : '¡No se puede eliminar!' , 
									contenido: `porque se ha utilizado en otros registros, solo puede cambiar su estado` 
								})
							

						},objecto.variables)
						 
						
						
			}
		)


})

}


var boton_editar = ( funcion ) => {

	$("#botonEditar").click(()=>{
	
	$(".cerrar").addClass('invisible')
	$("#botonEditar").addClass('invisible')
	$("#botonEstado").addClass('invisible')
	$("#botonEliminar").addClass('invisible')
	
	$("#botonGuardar").removeClass('invisible');
	$("#botonCancelar").removeClass('invisible');

	$("input").disabled(false)
	$("select").disabled(false)
		funcion()
	})

}


var boton_status = ( objecto ) => {
	$("#botonEstado").click(() => {


	mensajeSiNo(
			{ 
				titulo: "¡Alerta!",
				contenido: "¿Estas seguro que desas Cambiar su estado actual?",
				titulo2: "¡Listo!",
				contenido2: "Estado actual modificado"

			},
			() => {


						ajax(localStorage.ajax + objecto.url, (rsp) =>{

					
							mensajeOk2({
								titulo   : 'Estado Cambiado' ,
							 	contenido: `El estado del registro fue cambiado ` 
							 } ,  
							 	() => {window.location.href = localStorage.ajax + objecto.direct } 
							)
							
						}, objecto.variables )// fin de ajax
						 
						
						
			}
		)

});
}


var boton_cancelar = ()=>{

	$("#botonCancelar").click( () => {


	$(".cerrar").removeClass('invisible');
	$("#botonEditar").removeClass('invisible')
	$("#botonEstado").removeClass('invisible')
	$("#botonEliminar").removeClass('invisible')

	$("#botonGuardar").addClass('invisible')
	$("#botonCancelar").addClass('invisible')

	$("input").disabled(true)
	$("select").disabled(true)

})
}

var boton_guardar = (objecto) =>{

console.log(objecto.variables)
	$("#botonGuardar").click( ()=> {


	ajax(
	localStorage.ajax + objecto.url, 
		(rsp) =>{
		
			if(rsp.trim() == 1){
				mensajeOk2({
					titulo : 'Modificado' ,
				 contenido: 'El registro fue modficado existosamente'
				},()=>{window.location.href = localStorage.ajax + objecto.direct }  )
			
			}//if
			else {
			
				mensajeNo({
					titulo : 'No se puede Modificar' ,
				 contenido: objecto.mensaje
				})
			}
		},
		
			objecto.variables

		)
})

}


 var editar_modal = (objecto , funcion ) => {

	
		$("select").disabled(true)
		$("input").disabled(true)

		let id = objecto.id
		let principal = objecto.principal
		let secundario = objecto.secundario
		let v = objecto.v

	let eliminar = {

		url       : 'eliminar'+secundario,
		direct    : principal,
		variables :  id
	}

	let guardar = {

		url       : 'editar'+secundario,
		direct    : principal,
		variables :  v,
		mensaje   : objecto.sms
	}


	let editar = () => {

		$("#rif").disabled(true)
	}

	let status = {

		url       : 'status'+secundario,
		direct    : principal,
		variables :  id
	}



	Menu() //invocamos los scripts del menu 



	// eliminar Usuario 
	boton_eliminar(eliminar)
	boton_editar(editar)
	boton_status(status)
	boton_cancelar()
	boton_guardar(guardar)



	funcion

	

 }