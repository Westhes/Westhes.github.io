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
        this.targetFrameRateMS = 1000 / targetFrameRate;

        this.stop = false;
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
        
        // Update
        this.update(delta, now);
        
        // While loop so we can catch up if neccesary(?)
        // Using an if statement speeds up gameplay if necessary, but gives a smoother catchup experience.
        if (fixedDelta >= this.targetFixedUpdate)
        {
            // Actual fixedUpdate
            //let diff = (now - this.lastFixedUpdate) / 1000;
            //console.log("diff: ",diff, "FixedUpdate:", this.targetFixedUpdate);

            // In a ideal world there is no delay, but that's obviously not the case.
            // Subtract the delay to make the next event fire ever so slightly faster.
            this.lastFixedUpdate = now - (now - this.lastFixedUpdate - this.targetFixedUpdateMS);
            // Lets just tell the method 
            this.fixedUpdate(this.targetFixedUpdate, now);
        }

        // The refresh rate is less important, we can be less accurate here.
        if (frameDelta >= this.targetFrameRate)
        {
            this.lastFrame = now - (now - this.lastFrame - this.targetFrameRateMS);
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

    update(deltaTime, now) {
        this.gameObjects.forEach(gameObject => {
            gameObject.update(deltaTime, now);
        });
    }

    fixedUpdate(fixedDeltaTime, now) {
        this.gameObjects.forEach(gameObject => {
            gameObject.fixedUpdate(fixedDeltaTime, now);
        });
    }

    render() {
        // this.stop = true;
        
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gameObjects.forEach(gameObject => {
            gameObject.render(this.context);
        });
    }

    input(i) {
        let keyCode = i.keyCode;
        switch (keyCode) {
            case 27: // 'ESC'ape
            case 80: // 'P'
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

class FPSCounter
{
    constructor(game) {
        this.x = 10;
        this.y = 10;
        this.fps = 0;

        // Manually calculate rendered frames
        this.lastSecond = performance.now();
        this.targetFrameRate = Math.round(1 / game.targetFrameRate);
        this.ticks = 0;
        this.renderedFramesPerSecond = 0;
    }

    update(deltaTime, now) {
        this.fps = 1/deltaTime;
     }
    
    fixedUpdate(fixedDeltaTime, now) { }

    render(ctx) {
        this.ticks++;
        if (this.ticks >= this.targetFrameRate) {
            let now = performance.now();
            // Calculate the fps by counting the frames dividing it by the time passed in seconds
            this.renderedFramesPerSecond = (this.ticks / ((now-this.lastSecond)/1000)).toFixed(2);
            this.lastSecond = now;
            this.ticks = 0;
        }

        ctx.fillText(this.fps.toFixed(2) + " Update rate", this.x, this.y);
        ctx.fillText(this.renderedFramesPerSecond + " Frame rate", this.x, this.y + 10);
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
        this.hasSave = false;
    }

    update(deltaTime, now) {}
    fixedUpdate(fixedDeltaTime, now){}
    render(ctx) {
        if (this.hasSave) {
            ctx.restore();
            return;
        }
        ctx.beginPath();
        ctx.moveTo(0, this.canvasHeight);
        for (let i = 0; i < this.waves.length; i++) {
            const element = this.waves[i];
            const isCurve = element.y0 !== element.y1;
            if (isCurve) {
                for (let x = element.x0; x < element.x1; x++) {
                    ctx.lineTo(x, MathExtension.Lerp(element.y0, element.y1, MathExtension.SmoothStep(element.x0, element.x1, x)));
                }
            }
            else {
                ctx.lineTo(element.x1, element.y1);
            }
        }
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
        ctx.fill();
    }

    onCanvasResize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.hasSave = false;
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

    getWaveAtPosition(x) {
        for (let i = 0; i < this.waves.length; i++) {
            const element = this.waves[i];
            if (x < element.x1) return element;
        }
        // if (wave.y0 === wave.y1) return wave.y0;
        // return Terrain.Lerp(wave.y0, wave.y1, Terrain.SmoothStep(wave.x0, wave.x1, x));
    }

    static getWaveHeightAtPosition(x, wave) {
        return MathExtension.Lerp(wave.y0, wave.y1, MathExtension.SmoothStep(wave.x0, wave.x1, x));
    }

    static StraightLine(prevLine) {
        let x = prevLine.x1;
        let y = prevLine.y1;
        return {x0: x, y0: y, x1: x + 5, y1: y};
    }

    static CurveLine(prevCurve, isHill) {
        const x0 = prevCurve.x1;
        const x1 = x0 + MathExtension.Lerp(Terrain.MinWaveWidth, Terrain.MaxWaveWidth, Math.random());
        const y0 = prevCurve.y1;
        let y1 = (isHill) 
            ? y0 - MathExtension.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random())
            : y0 + MathExtension.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random());
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
}

class MathExtension {
    static Lerp(p0, p1, t) { return p0 + (p1 - p0) * t; }

    static Unlerp(p0, p1, t) { return (t - p0) / (p1 - p0); }

    static Clamp (num, min, max) { return Math.min(Math.max(num, min), max); }

    static SmoothStep(p0, p1, t)
    {
        if (t < p0) return 0;
        if (t >= p1) return 1;
        const x = (t - p0) / (p1 - p0);
        return x * x * (3 - 2 * x);
    }

}

class Player {
    constructor(terrain) {
        // Last fixed update positions
        this.x = 15;
        this.y = 10;
        // Interpolation
        this.ix = 15;
        this.iy = 10;
        // Interpolation limits
        this.iMaxX = terrain.canvasWidth;
        this.iMaxY = 999999;
        this.iMinX = 0;
        this.iMinY = -100;

        // Velocity
        this.velocityX = 0;
        this.velocityY = 0;
        this.terrain = terrain;
        this.isGrounded = false;

        this.lastFixedUpdate = 0;
        this.predictedNextFixedUpdate = 0;
        this.fixedDeltaTime = 0;

        // this.floor
        window.addEventListener('keydown', this.input.bind(this), false);
    }

    update(deltaTime, now) {
        // Get the time between previous and now
        let t = MathExtension.Unlerp(this.lastFixedUpdate, this.predictedNextFixedUpdate, performance.now());
        // Interpolate between previous fixed update and the next one
        this.ix = Player.interpolate(this.x, this.x + this.velocityX * this.fixedDeltaTime, t, this.iMinX, this.iMaxX); //MathExtension.Lerp(this.x, this.x + this.velocityX * this.fixedDeltaTime, t);
        this.iy = Player.interpolate(this.y, this.y + this.velocityY * this.fixedDeltaTime, t, this.iMinY, this.iMaxY);//MathExtension.Lerp(this.y, this.y + this.velocityY * this.fixedDeltaTime, t);
    }
    
    fixedUpdate(fixedDeltaTime, now) {
        // FixedUpdate might get called a update later, which could slow down/stutter the velocity if we say t = 1.
        let t = MathExtension.Unlerp(this.lastFixedUpdate, this.predictedNextFixedUpdate, now);
        
        // console.log("Last: ", this.lastFixedUpdate, " Predicted: ", this.predictedNextFixedUpdate, " Actual:", now);
        this.lastFixedUpdate = now;
        this.predictedNextFixedUpdate = this.lastFixedUpdate + fixedDeltaTime * 1000;
        this.fixedDeltaTime = fixedDeltaTime;
        
        if (isFinite(t))
        {
            // this.ix = this.x = MathExtension.Lerp(this.x, this.x + this.velocityX * fixedDeltaTime, t);
            // this.iy = this.y = MathExtension.Lerp(this.y, this.y + this.velocityY * fixedDeltaTime, t);
            this.x = this.ix;
            this.y = this.iy;

            const wave = this.terrain.getWaveAtPosition(this.ix);
            const floorHeight = Terrain.getWaveHeightAtPosition(this.ix, wave);

            const predictedX = this.x + this.velocityX * fixedDeltaTime;
            const predictedY = this.y + this.velocityY * fixedDeltaTime;

            
            this.iMaxY = floorHeight
            
            // If the player is in the air
            // 900 < 1000 - 5
            if (this.iy < floorHeight - 5) {
                this.isGrounded = false;
                console.log("In air!");
                this.velocityY += 9.81;
            // 900 < 1000
            } else if (this.iy < floorHeight) {
                this.isGrounded = true;
                console.log("close..");
            } else {
                console.log("Grounded!");
                this.isGrounded = true;
                this.iy = floorHeight;
                this.y = floorHeight;
                console.log(this.velocityY);

                if (Math.abs(this.velocityY) <= 20)
                    this.velocityY = 0;
                else
                    this.velocityY *= -0.6;
                //this.velocityY = 0;
            }

            if (this.ix >= this.iMaxX || this.ix <= this.iMinX) {
                this.velocityX *= -0.8;
            }
            // this.velocityX = 200;
            // this.terrain.
        }

        // Apply drag
        this.velocityX *= .999;
        this.velocityY *= .999;
    }

    static interpolate(x1, x2, t, min, max) {
        return MathExtension.Clamp(MathExtension.Lerp(x1, x2, t), min, max);
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.ix, this.iy, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    onCanvasResize(width, height) {}

    input(key) {
        const keyCode = key.keyCode;
        switch(keyCode) {
            case 83: // 'S' pressed
                this.velocityY = 2;
                break;
            case 68: // 'D' pressed
                this.velocityX = 100;
                break;
        }
    }
}

function startGame() {
    const game = new Game(144, 20);
    const terrain = new Terrain();
    game.addGameobject(new FPSCounter(game));
    game.addGameobject(terrain);
    game.addGameobject(new Player(terrain));
}

startGame();