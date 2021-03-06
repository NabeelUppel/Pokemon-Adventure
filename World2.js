import * as THREE from './resources/threejs/r128/build/three.module.js';
import cannonDebugger from "./resources/cannon-es-debugger/dist/cannon-es-debugger.js"
import * as CANNON from './resources/cannon-es/dist/cannon-es.js'
import * as CHARACTER from "./js/Character.js"
import * as CAMERA from "./js/ThirdPersonCamera.js";
import * as POKEMON from "./js/Pokemon.js"
import * as SKYBOX from "./js/skybox.js";
import * as HILL from "./js/hill.js";
import * as LEVEL2 from "./js/level2.js";
import {Body} from "./resources/cannon-es/dist/cannon-es.js";


(function () {
    let script = document.createElement('script');
    script.onload = function () {
        let stats = new Stats();
        document.body.appendChild(stats.dom);
        requestAnimationFrame(function loop() {
            stats.update();
            requestAnimationFrame(loop)
        });
    };
    script.src = '//mrdoob.github.io/stats.js/build/stats.min.js';
    document.head.appendChild(script);
})()

class World {

    constructor() {
        this._Declare();
        this.InitCANNON();
        this.InitTHREE();
        this.InitUI();
        //this.debug = new cannonDebugger(this.scene, this.world.bodies);
    }

    //Declare Variables that is needed.
    _Declare() {
        this.clock = new THREE.Clock();
        this.meshes = [];
        this.bodies = [];
        this.removeBodies = [];
        this.removeMeshes = [];
        this.timeStep = 1 / 60;
        this.yPosGround = -100;
        //used for character model and animations.
        this._mixers = [];
        this._previousRAF = null;
        this.Pokeballs = 45;
        this.Pause = false;

        document.getElementById("explore").onclick = () => {
            if (this.Character) {
                this.Character.setStop();
                document.getElementById("Win").style.width = "0%"
                this.Pause = false;
                this.Render()
            }
        }
    }

    InitUI() {
        this.addPokeballCount()
        this.addPauseButton()
    }

    //Initialise ThreeJS, Set up canvas, camera, scene and renderer.
    //Sets up the basic world.
    InitTHREE() {
        //Canvas and Renderer Setup.
        this.canvas = document.querySelector('#c');

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            //antialias: true,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;


        //Scene Setup
        this.scene = new THREE.Scene();
        const loader = new THREE.TextureLoader();
        this.scene.background = loader.load('./resources/images/skybox/rainbow_rt.png');


        this.mapCamera = new THREE.OrthographicCamera(-1000, 1000, 1000, -1000, 1, 1000);
        this.mapCamera.position.y = 500;
        this.scene.add(this.mapCamera);


        //Camera Setup
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1;
        const far = 2000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(25, 30, 25);

        //adds directional light to scene.
        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        this.LightEnable(light);
        this.scene.add(light);

        //add hemisphere light to scene.
        this.addHemisphereLight(0xB1E1FF, 0xB97A20)

        this.StartPos = new CANNON.Vec3(0, -100, 0);

        this.mapWidth = 384/2;
        this.mapHeight = 192/2;
        this.mapCamera = new THREE.OrthographicCamera(
            this.mapWidth * 2,		// Left
            -this.mapWidth * 2,		// Right
            -this.mapHeight * 2,		// Top
            this.mapHeight * 2,	// Bottom
            1,         // Near
            1000);

        this.mapCamera.up = new THREE.Vector3(0, 0, -1);
        this.mapCamera.lookAt(new THREE.Vector3(0, -1, 0));

        this.addGround();
        this.addSkybox();
        this.music();
        this.createChecker();
        this.level2();


        //Load animated Model
        this.LoadAnimatedModel();

        //Render the initial scene. Will be recursively called thereafter.
        this.Render();
    }

    //Initialise CannonJS (Physics) including setting up the gravity and other resources.
    InitCANNON() {

        this.world = new CANNON.World();
        this.world.gravity.set(0, -200, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.broadphase.useBoundingBoxes = true;
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
        this.world.defaultContactMaterial.contactEquationRegularizationTime = 4;

    }


    //Enable different properties for the light.
    LightEnable(light) {
        light.position.set(0, 1000, 0);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 1500.0;
        light.shadow.camera.left = 2000;
        light.shadow.camera.right = -2000;
        light.shadow.camera.top = 2000;
        light.shadow.camera.bottom = -2000;
    }

    //Adds HemisphereLight.
    addHemisphereLight(skyColor, groundColor) {
        const intensity = 1;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        this.scene.add(light);
    }

    level2() {
        const CharParams = {
            camera: this.camera,
            scene: this.scene,
            world: this.world,
            bodies: this.bodies,
            meshes: this.meshes,
            yPosGround: this.yPosGround,
        }
        this.level2 = new LEVEL2.Level2(CharParams);
        this.level2.level2Layout();
    }

    //Add Ground.
    addGround() {
        const planeSize = 8000;

        let textureDiffuseUrl = 'resources/images/grasslight-small.jpg'
        let textureDiffuse = THREE.ImageUtils.loadTexture(textureDiffuseUrl);
        textureDiffuse.wrapS = THREE.RepeatWrapping;
        textureDiffuse.wrapT = THREE.RepeatWrapping;
        textureDiffuse.repeat.x = 10
        textureDiffuse.repeat.y = 10
        textureDiffuse.anisotropy = 16;

        let textureNormalUrl = 'resources/images/grasslight-small-nm.jpg'
        let textureNormal = THREE.ImageUtils.loadTexture(textureNormalUrl);
        textureNormal.wrapS = THREE.RepeatWrapping;
        textureNormal.wrapT = THREE.RepeatWrapping;
        textureNormal.repeat.x = 10
        textureNormal.repeat.y = 10
        textureNormal.anisotropy = 16;


        const groundShape = new CANNON.Plane();
        let groundBody = new CANNON.Body();
        groundBody.type = CANNON.Body.STATIC;
        groundBody.mass = 0;
        groundBody.updateMassProperties();
        groundBody.addShape(groundShape)
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, this.yPosGround, 0);
        groundBody.userData = {name: "GROUND"}
        this.world.addBody(groundBody);
        this.bodies.push(groundBody);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1);
        const planeMat = new THREE.MeshPhongMaterial({
            map: textureDiffuse,
            //normalMap	: textureNormal,
            side: THREE.DoubleSide,
        });

        let Ground = new THREE.Mesh(planeGeo, planeMat);
        //Ground.castShadow = false;
        //Ground.receiveShadow = true;
        Ground.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        this.scene.add(Ground);
        this.meshes.push(Ground);
    }

    //Checks to see if the window has changed size.
    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    //The actual renderer function.
    Render() {
        //If the windows needs resizing, it will resize it.
        if (this.resizeRendererToDisplaySize(this.renderer)) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;

            this.camera.updateProjectionMatrix();
        }
        
        //if game is pause break loop.
        if (this.Pause === true) {
            return
        }

        requestAnimationFrame((t) => {
            //t is the time that the scene will be animated in seconds.
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            //Recursively Call this method.
            this.Render();

            //actually render the scene.

            let w = window.innerWidth, h = window.innerHeight;


            // full display
            this.renderer.setViewport(0, 0, w, h);
            this.renderer.setScissor(0, 0, w, h);
            this.renderer.setScissorTest(true);
            this.renderer.render(this.scene, this.camera);

            // minimap (overhead orthogonal camera)


            if (this.Character  && this.mapCamera) {
                this.renderer.setViewport(50, 50, this.mapWidth, this.mapHeight);
                this.renderer.setScissor(50, 50, this.mapWidth, this.mapHeight);
                this.renderer.setScissorTest(true);
                this.mapCamera.position.y = 800;
                this.renderer.render(this.scene, this.mapCamera);
            }


            //physics and other updates done in this function.
            this.Step(t - this._previousRAF);

            this._previousRAF = t;
        });

    }

    //Function that keeps the meshes and physic bodies in-sync
    updateMeshPositions() {
        for (let i = 0; i !== this.meshes.length; i++) {
            this.meshes[i].position.copy(this.bodies[i].position)
            this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
        }
    }

    //Function that removes physic bodies and meshes from scenes if necessary
    removeObjects() {
        for (let i = 0; i < this.removeBodies.length; i++) {
            this.world.removeBody(this.removeBodies[i]);
            this.scene.remove(this.removeMeshes[i]);
            this.removeBodies.splice(i, 1)
            this.removeMeshes.splice(i, 1)
        }
    }

    //Loads Pokemon to scene including physic bodies.
    addPokemon() {
        //Positions where pokemon will appear.
        let positions = []

        //Top left
        for (let i = 0; i < 10; i++) {
            let x = THREE.MathUtils.randFloat(2500, 3700)
            let z = THREE.MathUtils.randFloat(2500, 3500)
            positions.push(new THREE.Vector3(x, this.yPosGround, z))
        }

        //Top right
        for (let i = 0; i < 5; i++) {
            let x = THREE.MathUtils.randFloat(-2500, -3700)
            let z = THREE.MathUtils.randFloat(2500, 3500)
            positions.push(new THREE.Vector3(x, this.yPosGround, z))
        }

        //Bottom right
        for (let i = 0; i < 5; i++) {
            let x = THREE.MathUtils.randFloat(-2500, -3700)
            let z = THREE.MathUtils.randFloat(-2500, -3500)
            positions.push(new THREE.Vector3(x, this.yPosGround, z))
        }

        //Bottom left
        for (let i = 0; i < 10; i++) {
            let x = THREE.MathUtils.randFloat(2500, 3700)
            let z = THREE.MathUtils.randFloat(-2500, -3500)
            positions.push(new THREE.Vector3(x, this.yPosGround, z))
        }


        //If Position is on player dont spawn pokemon there.
        var playerPosition = new THREE.Vector3(2700, this.yPosGround, -2700);
        const index = positions.indexOf(playerPosition)
        if (index > -1) {
            positions.splice(index, 1)
        }
        positions = [...new Set(positions)]


        //pass position and other params to as a dict to the pokemon class.
        const Params = {
            camera: this.camera,
            scene: this.scene,
            world: this.world,
            positions: positions,
        }
        this.PokemonLoader = new POKEMON.Pokemon(Params)
    }

    //Add Animated Models to the scene such as the character and the third person camera.
    LoadAnimatedModel() {
        //Add Pokemon
        this.addPokemon();

        const pokemonList = this.PokemonLoader.List;
        const taskList = this.PokemonLoader.Task

        //Params to be passed to the character class.
        const CharParams = {
            renderer: this.renderer,
            camera: this.camera,
            scene: this.scene,
            world: this.world,
            meshes: this.meshes,
            bodies: this.bodies,
            pokemon: pokemonList,
            startPos: this.StartPos,
            rBodies: this.removeBodies,
            rMeshes: this.removeMeshes,
            canvas: this.canvas,
            mapCamera: this.mapCamera,
            pokeballs: this.Pokeballs,
            taskList: taskList,
            WorkStation: this.checkObject
        }
        this.Character = new CHARACTER.Character(CharParams);

        //Setup third person camera class.
        if (this.Character) {
            const CamParams = {
                camera: this.camera,
                character: this.Character
            }
            this.CAM = new CAMERA.ThirdPersonCamera(CamParams);
        }

    }


    //Physic Update Function.
    Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        //Update Character Animations.
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }

        //Updates
        if (this.Character) {
            this.Character.Update(timeElapsedS);
            this.PokemonLoader.update();
            this.Pokeballs = this.Character.Pokeballs

            this.updatePokeballText();

            //If Game is over
            if (this.Character.getStop === true) {
                this.Pause = true;
            }
        }


        //Allow the physic world function to step forward in time.
        this.world.step(1 / 60);

        //Update/remove objects from world and scene.
        this.updateMeshPositions();
        this.removeObjects();

        //Update the third person camera.
        if (this.Character) {
            this.CAM.Update(timeElapsedS)
        }

    }


    music() {
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        const sound = new THREE.Audio(listener);

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('resources/sounds/level2.mp3', function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.3);
            sound.play();
        });
    }

    //Game Objects
    addSkybox() {
        const CharParams = {
            camera: this.camera,
            scene: this.scene,
            world: this.world,
            bodies: this.bodies,
            meshes: this.meshes
        }
        this.skybox = new SKYBOX.Skybox(CharParams);
        this.skybox.createSkybox();
    }

    createChecker() {
        const shape = new CANNON.Box(new CANNON.Vec3(20, 60, 20));
        this.checkerBody = new CANNON.Body();
        this.checkerBody.type = Body.STATIC;
        this.checkerBody.mass = 0;
        this.checkerBody.updateMassProperties();
        this.checkerBody.addShape(shape);
        this.checkerBody.position.set(-150, -100, 625);
        this.world.addBody(this.checkerBody);
        this.bodies.push(this.checkerBody);

        this.checkObject = new THREE.Group();
        let textureURLs = [  // URLs of the six faces of the cube map
            "resources/images/skybox/rainbow_ft.png",   // Note:  The order in which
            "resources/images/skybox/rainbow_bk.png",   //   the images are listed is
            "resources/images/skybox/rainbow_up.png",   //   important!
            "resources/images/skybox/rainbow_dn.png",
            "resources/images/skybox/rainbow_rt.png",
            "resources/images/skybox/rainbow_lf.png"
        ];

        let texture = new THREE.CubeTextureLoader().load(textureURLs);

        let geometry = new THREE.BoxGeometry(10, 25, 10);
        let material = new THREE.MeshBasicMaterial({
            color: 0xA8A9AD,
            envMap: texture
        });
        const Box = new THREE.Mesh(geometry, material);
        this.checkObject.add(Box);

        geometry = new THREE.BoxGeometry(7, 5, 7);
        material = new THREE.MeshBasicMaterial({
            color: 0x000000,
        });
        const laptopBottom = new THREE.Mesh(geometry, material);
        laptopBottom.position.set(0, 11, 0)
        this.checkObject.add(laptopBottom);

        texture = new THREE.TextureLoader().load("resources/images/keyboard.png");
        geometry = new THREE.PlaneGeometry(7, 7)
        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const laptopKeys = new THREE.Mesh(geometry, material);
        laptopKeys.position.set(0, 13.5, 0);
        laptopKeys.rotateX(Math.PI / 2);
        this.checkObject.add(laptopKeys);

        geometry = new THREE.BoxGeometry(7.5, 9, 1);
        material = new THREE.MeshBasicMaterial({
            color: 0x000000,
        });
        const laptopTop = new THREE.Mesh(geometry, material);
        laptopTop.position.set(0, 15, 3)
        this.checkObject.add(laptopTop);

        texture = new THREE.TextureLoader().load("resources/images/bear.png");
        geometry = new THREE.PlaneGeometry(7, 7)
        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const laptopScreen = new THREE.Mesh(geometry, material);
        laptopScreen.position.set(0, 16, 2.2);
        this.checkObject.add(laptopScreen);

        this.checkObject.scale.set(3, 3, 3);
        this.scene.add(this.checkObject);
        this.meshes.push(this.checkObject);
    }

    addHill() {
        const CharParams = {
            camera: this.camera,
            scene: this.scene,
            world: this.world,
            bodies: this.bodies,
            meshes: this.meshes,
            yPosGround: this.yPosGround
        }
        this.hill = new HILL.Hill(CharParams);
        this.hill.createHill();
    }

    //UI Elements
    addPokeballCount() {
        let img = document.createElement("img");
        img.src = "resources/images/pokeballIcon.png";
        img.id = "pokeballIcon";

        img.setAttribute("height", "90");
        img.setAttribute("width", "90");


        let width = 140
        this.textSpan = document.createElement("span")
        this.textSpan.id = "pokeballCount"
        this.textSpan.style.padding = "10px"
        this.textSpan.style.fontFamily = "Tahoma, sans-serif"
        this.textSpan.style.color = '#ffffff'
        this.textSpan.style.fontSize = 45 + 'px'
        this.textSpan.textContent = "x" + this.Pokeballs.toString()

        this.pokeballCount = document.createElement('div')
        this.pokeballCount.id = "PokeballDiv"
        this.pokeballCount.style.position = 'absolute';
        this.pokeballCount.style.display = "flex";
        this.pokeballCount.style.alignItems = "center";
        this.pokeballCount.append(img)
        this.pokeballCount.append(this.textSpan)
        this.pokeballCount.style.top = "10%";
        this.pokeballCount.style.left= "100%";
        this.pokeballCount.style.marginLeft= "-"+width+"px"
        this.pokeballCount.unselectable = "on"
        this.pokeballCount.style.transform="scale(0.5)";
        document.body.appendChild(this.pokeballCount)
    }

    addPauseButton() {
        let width = 100
        this.pauseIcon
            = document.createElement("input");
        this.pauseIcon
            .src = "resources/images/pauseIcon.png";
        this.pauseIcon
            .id = "pauseIcon";
        this.pauseIcon
            .style.position = 'absolute';
        this.pauseIcon
            .type = "image"
        this.pauseIcon
            .setAttribute("height", "100");
        this.pauseIcon
            .setAttribute("width", "100");

        this.pauseIcon
            .style.top = "0";
        this.pauseIcon
            .style.left = "100%";
        this.pauseIcon.style.marginLeft= "-"+width+"px"
        this.pauseIcon.onclick = () => {
            this.onPause()
        }
        this.pauseIcon.style.transform="scale(0.5)";
        document.body.appendChild(this.pauseIcon)
    }


    //Change Text of Pokeball Counter
    updatePokeballText() {

        let x = this.textSpan.textContent
        let oldCount = x.replace(/\D/g, '');
        if (this.Pokeballs.toString() !== oldCount) {
            this.textSpan.textContent = "x" + this.Pokeballs.toString()
        }

    }


    //What Happens when the pause icon is clicked
    onPause() {
        this.Pause = true
        let overlay = document.getElementById("myNav")
        overlay.style.width = "100%";
        let close = document.createElement('a')
        close.className = "closebtn";
        close.innerHTML = "X";
        close.style.position = "absolute";
        close.style.top = 20 + "px";
        close.style.right = 45 + "px";
        close.style.fontSize = 60 + "px";
        close.onclick = () => {
            this.onPauseExit()
        }
        overlay.append(close)
    }

    //What Happens when the pause menu is closed
    //Continue rendering game.
    onPauseExit() {
        this.Pause = false
        console.log("Exit", this.Pause)

        document.getElementById("myNav").style.width = "0%";
        this.Render()
    }
}

let _APP = null;

window.addEventListener('load', () => {
    _APP = new World();
});

