/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var _config = {
    "android": {
        "senderID": "442931165475",
        "sound": true,
        "vibration": true
    },
    "browser": {},
    "ios": {
        "sound": true,
        "vibration": true,
        "badge": true
    },
    "windows": {}
};


(function (_config, window) {

    angular.module('donweb', ['ngCookies'])
        .factory('usuarioService', usuarioService)
        .factory('notificacionesService', notificacionesService)
        .controller('AppController', AppController);

    function AppController ($http, $sce, $cookies, usuarioService, notificacionesService) {

        var self = this;

        self.cargando = true;
        self.usuario = usuarioService;
        self.notificaciones = notificacionesService;
        self.errorLogin;
        self.parcial = {cargando:false};
        self.errores = [];
        self.exitos = [];

        // Métodos
        self.init = init;
        self.onDeviceReady = onDeviceReady;
        self.setupPush = setupPush;
        self.enviarRegID = enviarRegID;
        self.login = login;
        self.logout = logout;
    
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        window.document.addEventListener('deviceready', self.init, false);

        ////////////

        function init () {

            if ( ! localStorage.getItem('notificacionesDW') || localStorage.getItem('notificacionesDW').indexOf('items') < 0) {

                localStorage.setItem('notificacionesDW', '{"items":[]}');
            }

            angular.merge(notificacionesService.items, JSON.parse(localStorage.getItem('notificacionesDW')).items);

            obtenerResumenDeServicios().then(function () {
                self.onDeviceReady();
            });
        }

        function onDeviceReady (argument) {
            self.setupPush();
        }

        function setupPush () {
            var push = PushNotification.init(_config);

            push.on('registration', function(data) {

                var oldRegId = localStorage.getItem('registrationId');
                
                if (oldRegId !== data.registrationId) {
                    localStorage.setItem('registrationId', data.registrationId);
                }

                navigator.notification.alert(
                    localStorage.getItem('registrationId'),
                    null,
                    'Chequeando localStorage!',
                    'Ok'
                );

                divMensaje.innerHTML = data.registrationId;
            });

            push.on('error', function(e) {
                console.log("push error = " + e.message);
            });

            push.on('notification', function(data) {

                navigator.notification.alert(
                    data.message,         // message
                    null,                 // callback
                    data.title,           // title
                    'Ok'                  // buttonName
                );
           });
        }

        function enviarRegID () {

            self.parcial.cargando = true;

            var url = 'https://micuenta.donweb.com/ajax-json/clientes/dispositivos/registrarDispositivo';

            return $http.jsonp($sce.trustAsResourceUrl(url), {jsonpCallbackParam: 'jsoncallback'})
                .then(function (response) {

                    if (response && response.data.jsonMC && response.data.jsonMC.resultado) {

                        self.exitos.push({'mensaje':response.data.jsonMC.resultado});
                    } else {

                        self.errores.push({'mensaje':response.data.jsonMC.error});
                    }

                    self.parcial.cargando = false;
                });

        }

        function login (form) {

            if (form && form.usuario && form.password) {

                self.cargando = true;

                var url = 'https://donweb.com/ajax-login.php';
                // OAuthProvider: OAuthProvider,
                // OAuthState: OAuthState
                $http.jsonp($sce.trustAsResourceUrl(url), {
                    jsonpCallbackParam: 'jsoncallback',
                    params: {
                        account:'old',
                        usernameLogin: form.usuario,
                        passLogin: form.password,
                        accion: 'login'
                    }
                })
                .then(function (response) {

                    if (response.data && response.data.root.site && response.data.root.site.login) {

                        angular.merge(usuarioService, response.data.root.site.login);
                        usuarioService.logueado = true;

                        self.enviarRegID().then(function () {
                            self.exitos.push({'mensaje':localStorage.getItem('registrationId')});
                        });

                    } else {

                        self.errores.push({'mensaje':response.data.jsonMC.error});
                        usuarioService.logueado = false;
                    }

                    self.cargando = false;
                });                
            }
        }

        function logout () {

            self.cargando = true;

            var url = 'https://donweb.com/ajax-login.php?accion=logout';
            // OAuthProvider: OAuthProvider,
            // OAuthState: OAuthState
            $http.jsonp($sce.trustAsResourceUrl(url), {
                jsonpCallbackParam: 'jsoncallback',
                // params: {
                //     account:'old',
                //     usernameLogin: form.usuario,
                //     passLogin: form.password,
                //     accion: 'login'
                // }
            })
            .then(function (response) {

                if (response && response.data.root.site && response.data.root.site.login) {

                    console.log(response.data.root.site.login);

                    angular.merge(usuarioService, response.data.root.site.login);
                    usuarioService.clienteID = '';
                    usuarioService.logueado = false;

                } else {

                    self.errores.push({'mensaje':response.data.jsonMC.error});
                }

                self.cargando = false;
            });                
        }


        function obtenerResumenDeServicios () {

            self.cargando = true;

            var url = 'https://micuenta.donweb.com/ajax-json/clientes/perfil/resumenDeServicios';

            return $http.jsonp($sce.trustAsResourceUrl(url), {jsonpCallbackParam: 'jsoncallback'})
                .then(function (response) {
                    
                    if (chequearLogin(response)) {

                        if (response && response.data.jsonMC && response.data.jsonMC.resultado) {

                            console.log(response.data.jsonMC.respuesta);
                        } else {

                            self.errores.push({'mensaje':response.data.jsonMC.error});
                        }

                        self.cargando = false;
                    }
                });

        }

        function chequearLogin (response) {

            if ( ! response.data.jsonMC.session) {

                usuarioService.logueado = false;
                self.cargando = false;
                console.log('usuario no logueado');
                return false;

            } else {
                angular.merge(usuarioService, response.data.jsonMC.session);
                usuarioService.logueado = true;
                return true;
            }
        }
    }

    function usuarioService () {

        var self = this;

        self.usuario = null;
        self.logueado = false;

        return self;
    }

    function notificacionesService () {

        var self = this;

        self.items = [];
        self.agregar = agregar;

        return self;

        ////////////

        function agregar (item) {

            self.ls = JSON.parse(localStorage.getItem('notificacionesDW'));

            self.ls.items.push({'mensaje':item});

            angular.merge(self.items, self.ls.items);

            localStorage.setItem('notificacionesDW', JSON.stringify(self.ls));
        }
    }

})(_config, window);

