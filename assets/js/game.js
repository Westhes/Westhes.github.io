class Game {
    /**
     * C'tor
     * @param {Int} targetFrameRate Target frame rate per second.
     * @param {Int} targetFixedUpdateRate Target fixed updates per second.
     */
    constructor(targetFrameRate, targetFixedUpdateRate) {
        this.fps = 0;
        this.canvas = document.getElementById("gameWindow");
        this.canvas.width = document.body.clientWidth - 30;
        this.canvas.height = 500;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.context = this.canvas.getContext('2d');
        this.lastUpdate = 0;
        this.lastFixedUpdate = 0;
        this.lastFrame = 0;

        this.targetFixedUpdate = 1 / targetFixedUpdateRate;
        this.targetFixedUpdateMS = 1000 / targetFixedUpdateRate;
        this.targetFrameRate = 1 / targetFrameRate;

        this.stop = true;
        this.gameObjects = [];

        // Get the right update method.
        this.updateMethod = Game.GetUpdateMethod();
        // Handle rescaling
        new ResizeObserver(this.onWindowResize).observe(document.body);
        // this.startLoop();
        window.addEventListener('keydown', this.input.bind(this), false);
        this.startLoop();
    }

    startLoop() {
        this.stop = false;
        this.lastUpdate = performance.now();
        this.lastFixedUpdate = performance.now();
        this.lastFrame = performance.now();
        console.log(this);
        this.updateMethod(this.gameLoop.bind(this));
    }

    gameLoop() {
        if (this.stop === false) {
            this.updateMethod(this.gameLoop.bind(this));
        }
        let now = performance.now();
        let delta = (now - this.lastUpdate)/1000;
        let fixedDelta = (now - this.lastFixedUpdate)/1000; 
        let frameDelta = (now - this.lastFrame)/1000;
        
        this.lastUpdate = now;
        
        this.fps = 1/delta; // Remove?

        // Update
        this.update(delta);
        
        // While loop so we can catch up if neccesary(?)
        // Using an if statement speeds up gameplay if necessary, but gives a smoother catchup experience.
        if (fixedDelta >= this.targetFixedUpdate)
        {
            // In a ideal world there is no delay, but that's obviously not the case.
            // Subtract the delay to make the next event fire ever so slightly faster.
            this.lastFixedUpdate = now - (now - this.lastFixedUpdate - this.targetFixedUpdateMS);
            // Lets just tell the method 
            this.fixedUpdate(this.targetFixedUpdate);
        }

        // The refresh rate is less important, we can be less accurate here.
        if (frameDelta >= this.targetFrameRate)
        {
            this.lastFrame = now;
            this.render();
        }
    }

    onWindowResize() {
        // Handle resize logic here
        //console.log(document.body.clientWidth, document.body.clientHeight);
        // this.gameObjects.forEach(gameObject => {
        //     this.gameObject.onCanvasResize();
        // })
    }

    update(deltaTime) {
        this.gameObjects.forEach(gameObject => {
            gameObject.update(deltaTime);
        });
    }

    fixedUpdate(fixedDeltaTime) {
        this.gameObjects.forEach(gameObject => {
            gameObject.fixedUpdate(fixedDeltaTime);
        });
    }

    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gameObjects.forEach(gameObject => {
            gameObject.render(this.context);
        });

        this.stop = true;
    }

    input(i) {
        let keyCode = i.keyCode;
        switch (keyCode) {
            // ESC - Play/Pause game
            case 27:
                this.stop = !this.stop;
                console.log("Is Playing = ", !this.stop);
                if (this.stop === false) {
                    this.startLoop();
                }
                break;
        
            default:
                console.log(keyCode);
                break;
        }
    }

    addGameobject(newGameObject) {
        this.gameObjects.push(newGameObject);
        newGameObject.onCanvasResize(this.width, this.height);
    }

    static GetUpdateMethod() {
        return window.requestAnimationFrame.bind(window) || 
            window.webkitRequestAnimationFrame.bind(window) || 
            window.mozRequestAnimationFrame.bind(window) || 
            window.oRequestAnimationFrame.bind(window) || 
            window.msRequestAnimationFrame.bind(window) || 
            function(callback, element){
                window.setTimeout(function(){
                    callback();
                }, 1000 / 60); // Timeout callback ~60fps / ~16.666ms update
            }.bind(window);
    }
}

class Test
{
    constructor() {
        this.x = 10;
        this.y = 10;
        this.counter = 0;
        this.lastUpdate = performance.now();
    }

    update(deltaTime) {

    }
    
    fixedUpdate(fixedDeltaTime) {
        //this.counter += 1;
        //let t = performance.now();
        //let ticksDifference = (t - this.lastUpdate);
        //console.log("counter:", this.counter, " Ticks since last: ", ticksDifference);
        //this.lastUpdate = t;

        this.x += 5 * fixedDeltaTime;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
        ctx.moveTo(110, 75);
        ctx.arc(75, 75, 35, 0, Math.PI, false);  // Mouth (clockwise)
        ctx.moveTo(65, 65);
        ctx.arc(60, 65, 5, 0, Math.PI * 2, true);  // Left eye
        ctx.moveTo(95, 65);
        ctx.arc(90, 65, 5, 0, Math.PI * 2, true);  // Right eye
        ctx.stroke();
    }

    onCanvasResize(width, height) {}
}

class Terrain
{
    constructor() {
        this.x = 0;
        this.y = 150;
        this.length = Math.PI*2;
        this.step = 1;
        this.canvasWidth = 0;
        this.canvasHeight = 0

        this.waves = [];

        for (let index = 0; index < 20; index++) {
            const prev = this.waves[index-1];
            const isInverse = index % 2 == 0;
            let offset = prev.offset + prev.minima;
            let a = Math.random() * 4;
            let b = Math.random() * 5;
            if (index == 0)
            {
                //const isInverse = index % 2 == 0;
                let offset = 0;
                let a = 1.2;
                let b = 2.2;
                let minima = Terrain.FindLocalMinima(a, b);
                let max = Terrain.getHeight(0, a, b);
                let min = Terrain.getHeight(minima, a, b);
                this.waves.push({
                    offset,
                    a,
                    b,
                    minima,
                    min,
                    max,
                });
                continue;
            }
            // let prev = this.waves[index-1];
            // console.log(prev, this.waves[index-1].offset, this.waves[index-1].minima);
            
            let minima = Terrain.FindLocalMinima(a,b);
            let max = Terrain.getHeight(0, a, b);
            let min = Terrain.getHeight(minima, a, b);

            this.waves.push({
                offset,
                a,
                b,
                minima,
                isInverse,
                min,
                max,
            })
        }
        console.log(this.waves); 
        
        // this.lengthMultiplierA = 1.2;
        // this.lengthMultiplierB = 2.2;
        // this.waveMinima = Terrain.FindLocalMinima(this.lengthMultiplierA, this.lengthMultiplierB);
        // console.log(this.waveMinima);
        // this.waveHeightMultiplier =50.0;
    }

    update(deltaTime) {}
    fixedUpdate(fixedDeltaTime){}
    render(ctx) {
        ctx.beginPath();
        // Start from bottom left
        ctx.moveTo(0, this.canvasHeight);
        for (let index = 0; index < this.waves.length; index++) {
            const element = this.waves[index];
            
            for (let xPos = element.offset * 10; xPos <= element.offset * 10 + element.minima * 10; xPos += this.step) { // Change this back to this.length.
                ctx.lineTo(xPos * 10, this.canvasHeight - this.y - Terrain.getHeight(xPos / 10, element.a, element.b) * 20);
            } 
        }
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
        // for (let xPos = 0; xPos <= this.waveMinima * 10; xPos += this.step) { // Change this back to this.length.
        //     ctx.lineTo(xPos * 10, this.canvasHeight - this.y - Terrain.getHeight(xPos / 10, this.lengthMultiplierA, this.lengthMultiplierB) * 20);
        // }
        //ctx.lineTo(this.canvasWidth, this.canvasHeight);
        console.log(this.length);
        // ctx.moveTo(65, 65);
        // ctx.arc(60, 65, 5, 0, Math.PI * 2, true);  // Left eye
        // ctx.moveTo(95, 65);
        // ctx.arc(90, 65, 5, 0, Math.PI * 2, true);  // Right eye
        ctx.fill();
    }
    onCanvasResize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    static getHeight(xPos, waveLengthMultiplierA, waveLengthMultiplierB) {
        return Math.cos(xPos * waveLengthMultiplierA) + Math.cos(xPos * waveLengthMultiplierB);
    }

    static FindLocalMinima(multiplierA, multiplierB)
    {
        const startX = 1 / Math.max(multiplierA, multiplierB) * Math.PI;
        let lowestPointX = startX;
        let lowestPointY = 9999999;
        let stepSize = 0.1;
        let isDecrementingX = false;

        for (let i = 0; i < 40; i++) {
            let offset = isDecrementingX ? lowestPointX - stepSize : lowestPointX + stepSize;
            let currentY = Terrain.getHeight(offset, multiplierA, multiplierB);

            if (currentY <= lowestPointY) {
                lowestPointX = offset;
                lowestPointY = currentY;
            }
            else {
                let nextY = Terrain.getHeight(offset + 0.001, multiplierA, multiplierB);
                // Check if the nextY is still smaller than the currentY, indicating that we have to use smaller steps.
                if (isDecrementingX == nextY <= currentY) stepSize *= 0.1;
                isDecrementingX = (nextY > currentY);
            }
        }
        return lowestPointX;
    }
}

function startGame() {
    const game = new Game(20, 20);
    //const timer = new Test();
    game.addGameobject(new Test());
    game.addGameobject(new Terrain());
}

startGame();