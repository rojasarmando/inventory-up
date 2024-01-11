-- phpMyAdmin SQL Dump
-- version 4.6.6
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 30-04-2018 a las 10:26:10
-- Versión del servidor: 5.7.17-log
-- Versión de PHP: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `inventory_kajataca`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `abastecimiento`
--

CREATE TABLE `abastecimiento` (
  `id_abastecimiento` int(10) UNSIGNED NOT NULL,
  `id_productos` int(10) UNSIGNED DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fecha_c` datetime DEFAULT NULL,
  `fecha_m` datetime DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categorias` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categorias`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 'Bebidas Alcoholicas', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(2, 'Otro tipo de Bebidas', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id_configuracion` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `fecha` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id_configuracion`, `descripcion`, `fecha`) VALUES
(1, '137627911d58602826fd657b3caccb1e', '2018-03-11 00:37:44'),
(2, '137627911d58602826fd657b3caccb1e', '2018-03-11 00:37:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `despacho`
--

CREATE TABLE `despacho` (
  `id_despacho` int(10) UNSIGNED NOT NULL,
  `id_productos` int(10) UNSIGNED DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fecha_c` datetime DEFAULT NULL,
  `fecha_m` datetime DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `distribuidora`
--

CREATE TABLE `distribuidora` (
  `id_distribuidora` int(10) UNSIGNED NOT NULL,
  `id_empresas` int(10) UNSIGNED DEFAULT NULL,
  `descripcion` varchar(45) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `telefono` varchar(12) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `distribuidora`
--

INSERT INTO `distribuidora` (`id_distribuidora`, `id_empresas`, `descripcion`, `nombre`, `telefono`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 1, 'Doña Oliva Serrada', 'Nelsibeth Oliva', '04145235969', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1)

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresas`
--

CREATE TABLE `empresas` (
  `id_empresas` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `empresas`
--

INSERT INTO `empresas` (`id_empresas`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 'La Polar', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(2, 'La Regional', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(3, 'UnicornioLandia en Revolucion', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(12, 'PAPAS', '2018-04-27 21:53:31', '2018-04-27 21:53:31', 1),
(2605854, 'ARMAN', '2018-04-27 21:27:19', '2018-04-28 09:08:19', 1),
(11111111, 'AAAAAAAAAAAAAAAAAAASAS', '2018-04-27 21:21:43', '2018-04-27 21:21:43', 1),
(24234444, 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', '2018-04-27 21:29:04', '2018-04-27 21:29:04', 1),
(24444444, 'XXXXXXXXXXXXXXXXXXXXXXXXXX', '2018-04-27 21:28:12', '2018-04-27 21:28:12', 1),
(26059555, 'ARMANDO ROJASSS', '2018-04-27 21:26:10', '2018-04-27 21:26:10', 1),
(33333333, 'AAAAAAAAAAAAAAAAAAAAAAA', '2018-04-27 21:42:10', '2018-04-27 21:42:10', 1),
(55555555, 'SSSSSSSSSSSSSSSSSSSSSSSSSSSS', '2018-04-27 21:27:50', '2018-04-27 21:27:50', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id_eventos` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(70) NOT NULL,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id_eventos`, `descripcion`, `status`) VALUES
(1, 'Ingresó al Sistema', 1),
(2, 'Salio exitosamente del Sistema', 1),
(3, 'Intento ingresar a una pagina', 1),
(4, 'Ingreso a ', 1),
(5, 'Genero un nuevo  ', 1),
(6, 'Genero una nueva  ', 1),
(7, 'Modificando un ', 1),
(8, 'Modificando una ', 1),
(9, 'Cambio de Estado a un ', 1),
(10, 'Cambio de Estado a una ', 1),
(11, 'Abastecio ', 1),
(12, 'Despacho ', 1),
(13, 'Realizo un filtrado de tablas en modulo ', 1),
(14, 'Genero un Reporte en ', 1),
(15, 'Realizo una peticion AJAX en ', 1),
(16, 'Elimino un ', 1),
(17, 'Elimino a un ', 1),
(18, 'Ocurrion un error en ', 1),
(19, 'Intento ', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs`
--

CREATE TABLE `logs` (
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_eventos` int(10) UNSIGNED DEFAULT NULL,
  `id_usuarios` int(10) UNSIGNED DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `logs`
--

INSERT INTO `logs` (`fecha`, `id_eventos`, `id_usuarios`, `descripcion`) VALUES
('2018-04-28 09:25:44', 4, 2605957, 'consulta de usuarios'),
('2018-04-28 09:25:48', 4, 2605957, ' registrar usuario '),
('2018-04-28 09:25:51', 4, 2605957, 'consulta de usuarios'),
('2018-04-28 09:26:37', 4, 2605957, 'consulta de usuarios');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modulos`
--

CREATE TABLE `modulos` (
  `id_modulos` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `modulos`
--

INSERT INTO `modulos` (`id_modulos`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 'usuarios', '2018-04-27 17:49:21', '2018-04-27 17:49:21', 1),
(2, 'distribuidora', '2018-04-27 17:49:21', '2018-04-27 17:49:21', 1),
(3, 'logs', '2018-04-27 17:49:21', '2018-04-27 17:49:21', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id_roles` int(10) UNSIGNED DEFAULT NULL,
  `id_sub_modulos` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id_roles`, `id_sub_modulos`) VALUES
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presentacion`
--

CREATE TABLE `presentacion` (
  `id_presentacion` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `presentacion`
--

INSERT INTO `presentacion` (`id_presentacion`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 'Caja de 32 unidades', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(2, 'Caja de 28 unidades', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(3, 'Litros ', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(4, 'Mililitros ', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_productos` int(10) UNSIGNED NOT NULL,
  `id_sub_categorias` int(10) UNSIGNED DEFAULT NULL,
  `id_distribuidora` int(10) UNSIGNED DEFAULT NULL,
  `id_presentacion` int(10) UNSIGNED DEFAULT NULL,
  `descripcion` varchar(60) NOT NULL,
  `stock_max` int(11) DEFAULT NULL,
  `stock_min` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_roles` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_roles`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 'Root', '2018-04-27 17:49:23', '2018-04-27 17:49:23', 1),
(2, 'Administrador', '2018-04-27 17:49:23', '2018-04-27 17:49:23', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sub_categorias`
--

CREATE TABLE `sub_categorias` (
  `id_sub_categorias` int(10) UNSIGNED NOT NULL,
  `id_categorias` int(10) UNSIGNED DEFAULT NULL,
  `descripcion` varchar(45) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `sub_categorias`
--

INSERT INTO `sub_categorias` (`id_sub_categorias`, `id_categorias`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 1, 'Cerveza', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(2, 1, 'Cucuy de Penca', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(3, 2, 'Malta', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1),
(4, 2, 'Jugo', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sub_modulos`
--

CREATE TABLE `sub_modulos` (
  `id_sub_modulos` int(10) UNSIGNED NOT NULL,
  `id_modulos` int(10) UNSIGNED DEFAULT NULL,
  `descripcion` varchar(100) NOT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `sub_modulos`
--

INSERT INTO `sub_modulos` (`id_sub_modulos`, `id_modulos`, `descripcion`, `fecha_c`, `fecha_m`, `status`) VALUES
(1, 1, 'consultar', '2018-04-27 17:49:21', '2018-04-27 17:49:21', 1),
(2, 1, 'imprimir', '2018-04-27 17:49:21', '2018-04-27 17:49:21', 1),
(3, 1, 'registrar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(4, 1, 'modificar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(5, 1, 'desactivar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(6, 2, 'consultar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(7, 2, 'imprimir', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(8, 2, 'registrar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(9, 2, 'modificar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(10, 2, 'desactivar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1),
(11, 3, 'consultar', '2018-04-27 17:49:22', '2018-04-27 17:49:22', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuarios` int(10) UNSIGNED NOT NULL,
  `id_roles` int(10) UNSIGNED DEFAULT NULL,
  `nick` varchar(12) NOT NULL,
  `nombre` varchar(40) NOT NULL,
  `clave` varchar(100) DEFAULT NULL,
  `pregunta` varchar(50) DEFAULT NULL,
  `respuesta` varchar(100) DEFAULT NULL,
  `fecha_c` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_m` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuarios`, `id_roles`, `nick`, `nombre`, `clave`, `pregunta`, `respuesta`, `fecha_c`, `fecha_m`, `status`) VALUES
(2605957, 1, 'ARMANDO2018', 'ARMANDO ROJAS', 'e9348bb83f1cd3365dfab80ee46b610c', 'Eres Chavizta', '4f431ec1ec6304aaec6181accbc66cdf', '2018-04-27 17:49:23', '2018-04-27 17:49:23', 1),
(12964334, 1, 'NORKIS2018', 'NORKIS QUERALES', 'e9348bb83f1cd3365dfab80ee46b610c', 'Eres Chavizta', '4f431ec1ec6304aaec6181accbc66cdf', '2018-04-27 17:49:24', '2018-04-27 17:49:24', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `abastecimiento`
--
ALTER TABLE `abastecimiento`
  ADD PRIMARY KEY (`id_abastecimiento`),
  ADD KEY `pk12` (`id_productos`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categorias`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id_configuracion`);

--
-- Indices de la tabla `despacho`
--
ALTER TABLE `despacho`
  ADD PRIMARY KEY (`id_despacho`),
  ADD KEY `pk11` (`id_productos`);

--
-- Indices de la tabla `distribuidora`
--
ALTER TABLE `distribuidora`
  ADD PRIMARY KEY (`id_distribuidora`),
  ADD UNIQUE KEY `descripcion` (`descripcion`),
  ADD UNIQUE KEY `telefono` (`telefono`),
  ADD KEY `pk323` (`id_empresas`);

--
-- Indices de la tabla `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id_empresas`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id_eventos`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `logs`
--
ALTER TABLE `logs`
  ADD KEY `pk3` (`id_eventos`),
  ADD KEY `pk4` (`id_usuarios`);

--
-- Indices de la tabla `modulos`
--
ALTER TABLE `modulos`
  ADD PRIMARY KEY (`id_modulos`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD KEY `pk50` (`id_roles`),
  ADD KEY `pk51` (`id_sub_modulos`);

--
-- Indices de la tabla `presentacion`
--
ALTER TABLE `presentacion`
  ADD PRIMARY KEY (`id_presentacion`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_productos`),
  ADD UNIQUE KEY `descripcion` (`descripcion`),
  ADD KEY `pk5` (`id_sub_categorias`),
  ADD KEY `pk6` (`id_distribuidora`),
  ADD KEY `pk7` (`id_presentacion`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_roles`),
  ADD UNIQUE KEY `descripcion` (`descripcion`);

--
-- Indices de la tabla `sub_categorias`
--
ALTER TABLE `sub_categorias`
  ADD PRIMARY KEY (`id_sub_categorias`),
  ADD UNIQUE KEY `descripcion` (`descripcion`),
  ADD KEY `pk` (`id_categorias`);

--
-- Indices de la tabla `sub_modulos`
--
ALTER TABLE `sub_modulos`
  ADD PRIMARY KEY (`id_sub_modulos`),
  ADD KEY `pk49` (`id_modulos`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuarios`),
  ADD UNIQUE KEY `nick` (`nick`),
  ADD KEY `pk44` (`id_roles`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `abastecimiento`
--
ALTER TABLE `abastecimiento`
  MODIFY `id_abastecimiento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categorias` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id_configuracion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT de la tabla `despacho`
--
ALTER TABLE `despacho`
  MODIFY `id_despacho` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `distribuidora`
--
ALTER TABLE `distribuidora`
  MODIFY `id_distribuidora` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT de la tabla `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id_empresas` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55555556;
--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id_eventos` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;
--
-- AUTO_INCREMENT de la tabla `modulos`
--
ALTER TABLE `modulos`
  MODIFY `id_modulos` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT de la tabla `presentacion`
--
ALTER TABLE `presentacion`
  MODIFY `id_presentacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_productos` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_roles` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT de la tabla `sub_categorias`
--
ALTER TABLE `sub_categorias`
  MODIFY `id_sub_categorias` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT de la tabla `sub_modulos`
--
ALTER TABLE `sub_modulos`
  MODIFY `id_sub_modulos` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `abastecimiento`
--
ALTER TABLE `abastecimiento`
  ADD CONSTRAINT `pk12` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`);

--
-- Filtros para la tabla `despacho`
--
ALTER TABLE `despacho`
  ADD CONSTRAINT `pk11` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`);

--
-- Filtros para la tabla `distribuidora`
--
ALTER TABLE `distribuidora`
  ADD CONSTRAINT `pk323` FOREIGN KEY (`id_empresas`) REFERENCES `empresas` (`id_empresas`);

--
-- Filtros para la tabla `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `pk3` FOREIGN KEY (`id_eventos`) REFERENCES `eventos` (`id_eventos`),
  ADD CONSTRAINT `pk4` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`);

--
-- Filtros para la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD CONSTRAINT `pk50` FOREIGN KEY (`id_roles`) REFERENCES `roles` (`id_roles`),
  ADD CONSTRAINT `pk51` FOREIGN KEY (`id_sub_modulos`) REFERENCES `sub_modulos` (`id_sub_modulos`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `pk5` FOREIGN KEY (`id_sub_categorias`) REFERENCES `sub_categorias` (`id_sub_categorias`),
  ADD CONSTRAINT `pk6` FOREIGN KEY (`id_distribuidora`) REFERENCES `distribuidora` (`id_distribuidora`),
  ADD CONSTRAINT `pk7` FOREIGN KEY (`id_presentacion`) REFERENCES `presentacion` (`id_presentacion`);

--
-- Filtros para la tabla `sub_categorias`
--
ALTER TABLE `sub_categorias`
  ADD CONSTRAINT `pk` FOREIGN KEY (`id_categorias`) REFERENCES `categorias` (`id_categorias`);

--
-- Filtros para la tabla `sub_modulos`
--
ALTER TABLE `sub_modulos`
  ADD CONSTRAINT `pk49` FOREIGN KEY (`id_modulos`) REFERENCES `modulos` (`id_modulos`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `pk44` FOREIGN KEY (`id_roles`) REFERENCES `roles` (`id_roles`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
