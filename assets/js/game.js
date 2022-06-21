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
        this.expandWaves();
    }

    expandWaves() {
        let index = this.waves.length;
        if (index === 0) {
            this.waves.push({
                previous: null,
                next: null,
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
            prevElement.next = waveLine;
            waveLine.previous = prevElement;
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
        while (x > wave.x1 && wave.next !== null) wave = wave.next;
        while (x < wave.x0 && wave.previous !== null) wave = wave.previous;
        return MathExtension.Lerp(wave.y0, wave.y1, MathExtension.SmoothStep(wave.x0, wave.x1, x));
    }

    static StraightLine(prevLine) {
        let x = prevLine.x1;
        let y = prevLine.y1;
        return {previous: null, next: null, x0: x, y0: y, x1: x + 5, y1: y};
    }

    static CurveLine(prevCurve, isHill) {
        const x0 = prevCurve.x1;
        const x1 = x0 + MathExtension.Lerp(Terrain.MinWaveWidth, Terrain.MaxWaveWidth, Math.random());
        const y0 = prevCurve.y1;
        let y1 = (isHill) 
            ? y0 - MathExtension.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random())
            : y0 + MathExtension.Lerp(Terrain.MinWaveHeight, Terrain.MaxWaveHeight, Math.random());
        return {previous: null, next: null, x0, y0, x1, y1};
    }

    static Mirror(prevCurve) { return { x0: prevCurve.x1, y0: prevCurve.y1, x1: prevCurve.x1 + prevCurve.x1 - prevCurve.x0, y1: prevCurve.y0 }; }
}

class MathExtension {
    static Lerp(p0, p1, t) { return p0 + (p1 - p0) * t; }

    static LerpBetween(x1, x2, t, min, max) { return MathExtension.Clamp(MathExtension.Lerp(x1, x2, t), min, max); }

    static Unlerp(p0, p1, t) { return (t - p0) / (p1 - p0); }

    static Clamp (num, min, max) { return Math.min(Math.max(num, min), max); }

    static SmoothStep(p0, p1, t)
    {
        if (t < p0) return 0;
        if (t >= p1) return 1;
        const x = (t - p0) / (p1 - p0);
        return x * x * (3 - 2 * x);
    }

    static DotProduct(x0, y0, x1, y1) {
        return (x0 * x1 + y0 * y1);
    }

    static SurfaceNormal(x,y) {
        if (x < 0)
            return {x: -y, y: x};
        return {x: y, y: -x};
    }

    static Normalize(x, y) {
        // const x0 = x * x;
        // const y0 = y * y;
        // const length = x0 + y0;
        // return { x: x * x0 / length, y: y * y0 / length};
        const length = Math.sqrt(x * x + y * y);
        return { x:(x / length), y:(y / length) };
    }
}

class Player {
    constructor(terrain) {
        // Last fixed update positions
        this.x = 300;
        this.y = 10;
        // Interpolation
        this.ix = 15;
        this.iy = 10;
        // Interpolation limits
        this.iMaxX = terrain.canvasWidth;
        this.iMaxY = 999999;
        this.iMinX = 0;
        this.iMinY = -100;

        // Predicted location before the next fixedUpdate
        this.predictedX = 0;
        this.predictedY = 0;
        this.predictedFloorHeight = 0;
        this.floorDirection = null;
        this.floorSurfaceNormal = null;

        // Velocity
        this.velocityX = 0;
        this.velocityY = 0;
        this.terrain = terrain;
        this.isGrounded = false;

        this.lastFixedUpdate = 0;
        this.predictedNextFixedUpdate = 0;
        this.fixedDeltaTime = 0;

        // this.floor
        this.mousePos = { x: 0, y: 0};
        window.addEventListener('keydown', this.input.bind(this), false);
        onmousemove = this.mouseInput.bind(this);
    }

    update(deltaTime, now) {
        // Get the time between previous and now
        let t = MathExtension.Unlerp(this.lastFixedUpdate, this.predictedNextFixedUpdate, performance.now());
        // Interpolate between previous fixed update and the next one
        this.ix = MathExtension.LerpBetween(this.x, this.x + this.velocityX * this.fixedDeltaTime, t, this.iMinX, this.iMaxX); //MathExtension.Lerp(this.x, this.x + this.velocityX * this.fixedDeltaTime, t);
        this.iy = MathExtension.LerpBetween(this.y, this.y + this.velocityY * this.fixedDeltaTime, t, this.iMinY, this.iMaxY);//MathExtension.Lerp(this.y, this.y + this.velocityY * this.fixedDeltaTime, t);
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
            this.x = this.ix;
            this.y = this.iy;

            const wave = this.terrain.getWaveAtPosition(this.ix);
            //const floorHeight = Terrain.getWaveHeightAtPosition(this.ix, wave);

            // console.log("Current x: ", this.x," y: ", this.y, "Expected/Predicted x: ", this.predictedX, " y: ", this.predictedY);
            this.predictedX = this.x + this.velocityX * fixedDeltaTime;
            this.predictedY = this.y + this.velocityY * fixedDeltaTime;
            
            this.iMaxY = this.predictedFloorHeight


            // Calculate floor
            const horizontalDirection = (this.velocityX >= 0) ? 1 : -1;
            const floorForward = Terrain.getWaveHeightAtPosition(this.predictedX + horizontalDirection, wave);
            
            this.predictedFloorHeight = Terrain.getWaveHeightAtPosition(this.predictedX, wave);
            this.floorDirection = MathExtension.Normalize(horizontalDirection, floorForward - this.predictedFloorHeight);
            this.floorSurfaceNormal = MathExtension.SurfaceNormal(this.floorDirection.x, this.floorDirection.y);

            //this.velocityX = 20;
            // If the player is in the air
            // 900 < 1000 - 5
            if (this.iy < this.predictedFloorHeight - 5) {
                this.isGrounded = false;
                // console.log("In air!");
                this.velocityY += 9.81 * 100 * fixedDeltaTime;
            // 900 < 1000
            } else if (this.iy < this.predictedFloorHeight) {
                this.isGrounded = true;
                // console.log("close..");
                // Glide over the floor?
            } else {
                // console.log("Grounded!");
                this.isGrounded = true;
                this.iy = this.predictedFloorHeight;
                this.y = this.predictedFloorHeight;
                // console.log(this.velocityY);

                if (Math.abs(this.velocityY) <= 20)
                    this.velocityY = 0;
                else
                    this.velocityY *= -0.9;
                //this.velocityY = 0;
            }

            if (this.ix >= this.iMaxX || this.ix <= this.iMinX) {
                this.velocityX *= -0.8;
            }
            // this.velocityX = 200;
            // this.terrain.
        }

        // Apply drag
        //this.velocityX -= this.velocityX * 0.8 / (1/this.fixedDeltaTime);
        this.velocityY -= this.velocityY * 0.8 / (1/this.fixedDeltaTime);
    }

    render(ctx) {
        this.canvas = ctx;
        const defaultColor = "black"
        // Draw player
        ctx.beginPath();
        ctx.arc(this.ix, this.iy, 10, 0, Math.PI * 2);
        ctx.fillStyle = "purple";
        ctx.fill();
        ctx.fillStyle = defaultColor;

        if (Debug && this.floorDirection != null)
        {
            // Variables
            const lineLength = 100;
            const surfaceRightColor = "red";
            const surfaceUpColor = "yellow"; 
            const dotColor = "blue";
            const mouseColor = "green";
            ctx.lineWidth = 5;
            // Direction from the mouse to the predicted X and floor Y.
            const mouseDirection = MathExtension.Normalize(this.predictedX - this.mousePos.x, this.predictedFloorHeight - this.mousePos.y);

            // Draw predicted location
            ctx.beginPath();
            ctx.strokeStyle = surfaceRightColor;
            ctx.moveTo(this.ix, this.iy);
            ctx.lineTo(this.predictedX, this.predictedY);
            ctx.stroke();

            // Draw terrain right
            ctx.beginPath();
            ctx.moveTo(this.predictedX, this.predictedFloorHeight);
            ctx.lineTo(this.predictedX + this.floorDirection.x * lineLength, this.predictedFloorHeight + this.floorDirection.y * lineLength);
            ctx.stroke();

            // Draw surfacenormal
            ctx.beginPath();
            ctx.strokeStyle = surfaceUpColor;
            ctx.moveTo(this.predictedX, this.predictedFloorHeight);
            ctx.lineTo(this.predictedX + this.floorSurfaceNormal.x * lineLength, this.predictedFloorHeight + this.floorSurfaceNormal.y * lineLength);
            ctx.stroke();

            // Draw path to mouse:
            ctx.beginPath();
            ctx.strokeStyle = mouseColor;
            ctx.moveTo(this.predictedX - mouseDirection.x * 50, this.predictedFloorHeight - mouseDirection.y * 50);
            ctx.lineTo(this.predictedX, this.predictedFloorHeight);
            ctx.stroke();

            // Draw dot
            ctx.beginPath();
            ctx.strokeStyle = dotColor;
            let d = MathExtension.DotProduct(mouseDirection.x, mouseDirection.y, this.floorSurfaceNormal.x, this.floorSurfaceNormal.y);

            // Unity approach:
            const factor = -2 * d;
            const dirVec = {x: factor * this.floorSurfaceNormal.x + mouseDirection.x,
                            y: factor * this.floorSurfaceNormal.y + mouseDirection.y};

            ctx.moveTo(this.predictedX, this.predictedFloorHeight);
            ctx.lineTo(this.predictedX + dirVec.x * lineLength, this.predictedFloorHeight + dirVec.y * lineLength);

            ctx.stroke();

        }
        ctx.strokeStyle = defaultColor;
        ctx.lineWidth = 1;
    }

    onCanvasResize(width, height) {}

    input(key) {
        const keyCode = key.keyCode;
        switch(keyCode) {
            case 83: // 'S' pressed
                this.velocityY = 2;
                break;
            case 68: // 'D' pressed
                this.velocityX += 100;
                break;

            case 37: // Left pressed
                this.mousePos = {x: -1, y: 0}
                break;
            case 38: // Up pressed
                this.mousePos = {x: 0, y: 1}
                break
            case 39: // Right pressed
                this.mousePos = {x: 1, y: 0}
                break;
            case 40: // Down pressed
                this.mousePos = {x: 0, y: -1}
                break;
        }
    }

    mouseInput(e) {
        this.mousePos = Player.getMousePos(e);
        // console.log(this.mousePos);
    }
    static getMousePos(evt) {
        let canvas = document.getElementById("gameWindow");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
}

function startGame() {
    const game = new Game(144, 20);
    const terrain = new Terrain();
    game.addGameobject(new FPSCounter(game));
    game.addGameobject(terrain);
    game.addGameobject(new Player(terrain));
}
const Debug = true;
startGame();