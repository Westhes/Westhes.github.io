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
        new ResizeObserver(this.onWindowResize.bind(this)).observe(document.body);
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
        this.gameObjects.forEach(gameObject => {
            gameObject.onCanvasResize(this.width, this.height);
        })
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
        this.stop = true;
        
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gameObjects.forEach(gameObject => {
            gameObject.render(this.context);
        });
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
    static MinWaveWidth = 175;
    static MaxWaveWidth = 300;
    static MinWaveHeight = 100;
    static MaxWaveHeight = 200;
    constructor() {
        this.x = 0;
        this.y = 150;
        this.length = Math.PI*2;
        this.step = 1;
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        this.waves = [];
        this.furthestX = 0;
    }

    update(deltaTime) {}
    fixedUpdate(fixedDeltaTime){}
    render(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, this.canvasHeight);
        // console.log("Hello", this.waves);
        for (let i = 0; i < this.waves.length; i++) {
            const element = this.waves[i];
            const isCurve = element.y0 !== element.y1;
            if (isCurve) {
                for (let x = element.x0; x < element.x1; x++) {
                    ctx.lineTo(x, Terrain.Lerp(element.y0, element.y1, Terrain.SmoothStep(element.x0, element.x1, x)));
                }
            }
            else {
                ctx.lineTo(element.x1, element.y1);
            }
            
        }
        
        //ctx.lineTo(this.canvasWidth, 0);
        console.log(this);
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
        ctx.fill();
    }

    onCanvasResize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.expandWaves();
    }

    expandWaves() {
        let index = this.waves.length;
        if (index === 0) {
            this.waves.push({
                x0: 0,
                y0: this.canvasHeight - 200,
                x1: Terrain.MinWaveWidth,
                y1: this.canvasHeight - Terrain.MinWaveHeight,
            });
            index++;
        }
        while (this.furthestX < this.canvasWidth) {
            const prevElement = this.waves[this.waves.length -1];
            const isCurve = (prevElement.y0 === prevElement.y1);
            let waveLine = {};
            if (isCurve) {
                const earlierElement = this.waves[this.waves.length -2];
                const isHill = earlierElement.y0 < earlierElement.y1;
                waveLine = Terrain.CurveLine(prevElement, isHill);
                // this.waves.push(waveLine);
                // waveLine = Terrain.Mirror(waveLine);
            } else {
                waveLine = Terrain.StraightLine(prevElement);
            }
            if (waveLine.y1 > this.canvasHeight) waveLine.y1 = this.canvasHeight;
            this.waves.push(waveLine);
            this.furthestX = waveLine.x1;
            index++;
        }
    }

    static StraightLine(prevLine) {
        let x = prevLine.x1;
        let y = prevLine.y1;
        return {x0: x, y0: y, x1: x + 5, y1: y};
    }

    static CurveLine(prevCurve, isHill) {
        const x0 = prevCurve.x1;
        const x1 = x0 + Terrain.Lerp(Terrain.MinWaveWidth, Terrain.MaxWaveWidth, Math.random());
        const y0 = prevCurve.y1;
        let y1 = (isHill) 
            ? y0 - Terrain.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random())
            : y0 + Terrain.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random());
        return {x0, y0, x1, y1};
    }

    static Mirror(prevCurve) { return { x0: prevCurve.x1, y0: prevCurve.y1, x1: prevCurve.x1 + prevCurve.x1 - prevCurve.x0, y1: prevCurve.y0 }; }

    static SmoothStep(p0, p1, t)
    {
        if (t < p0) return 0;
        if (t >= p1) return 1;
        const x = (t - p0) / (p1 - p0);
        return x * x * (3 - 2 * x);
    }
    
    static Lerp(p0, p1, t) { return p0 + (p1 - p0) * t; }
}

function startGame() {
    const game = new Game(20, 20);
    //const timer = new Test();
    game.addGameobject(new Test());
    game.addGameobject(new Terrain());
}

startGame();