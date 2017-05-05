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
        .controller('AppController', AppController);

    function AppController ($http, $sce, $cookies) {

        var self = this;

        self.errorLogin;
        self.parcial = {cargando:false};

        // Métodos
        self.onDeviceReady = onDeviceReady;
        self.setupPush = setupPush;
        self.enviarRegID = enviarRegID;
        self.login = login;
    
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        window.document.addEventListener('deviceready', self.onDeviceReady, false);

        ////////////

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

                var oldRegId = $cookies.get('registrationId');
                
                if (oldRegId !== data.registrationId) {
                    $cookies.put('registrationId', data.registrationId);
                }

                navigator.notification.alert(
                    $cookies.get('registrationId'),
                    null,
                    'Chequeando cookie!',
                    'Ok'
                );

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

            $http.jsonp($sce.trustAsResourceUrl(url), {jsonpCallbackParam: 'jsoncallback'})
                .then(function (response) {
                    console.log('desde el callback', response.data.jsonMC);

                    if (response && response.data.jsonMC && response.data.jsonMC.resultado) {

                        console.log(response.data.jsonMC.respuesta);
                    } else {

                        self.errorLogin = response.data.jsonMC.error;
                    }

                    self.parcial.cargando = false;
                });

        }

        function login (form) {

            console.log(form);

            if (form && form.usuario && form.password) {

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

                    if (response && response.jsonMC && response.jsonMC.resultado) {

                        console.log(response.jsonMC.respuesta);
                    } else {

                        self.errorLogin = response.jsonMC.error;
                    }
                });                
            }

        }

    }

})(_config, window);
