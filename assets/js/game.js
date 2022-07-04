class Game {
    /**
     * C'tor
     * @param {Int} targetFrameRate Target frame rate per second.
     * @param {Int} targetFixedUpdateRate Target fixed updates per second.
     */
    constructor(targetFrameRate, targetFixedUpdateRate) {
        this.fps = 0;
        this.canvas = document.getElementById("gameWindow");
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = 320;
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

        this.stopped = !isPlaying;

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
        let now = performance.now();
        this.lastUpdate = now;
        this.lastFixedUpdate = now - this.targetFixedUpdateMS;
        this.lastFrame = now - this.targetFrameRateMS;
        // console.log(this);
        this.updateMethod(this.gameLoop.bind(this));
    }

    gameLoop() {
        this.updateMethod(this.gameLoop.bind(this));
        if (!isPlaying) {
            return;
        } else if (this.stopped) { // Ensure the times are setup correctly.
            this.stopped = false;
            this.startLoop();
        }
        const now = performance.now();
        const delta = (now - this.lastUpdate)/1000;
        const fixedDelta = (now - this.lastFixedUpdate)/1000; 
        const frameDelta = (now - this.lastFrame)/1000;
        this.lastUpdate = now;
        
        try {
            // While loop so we can catch up if neccesary(?)
            // Using an if statement speeds up gameplay if necessary, but gives a smoother catchup experience.
            if (fixedDelta >= this.targetFixedUpdate)
            {
                // Actual fixedUpdate
                // let fixedDeltaTime = (now - this.lastFixedUpdate) / 1000;

                // In a ideal world there is no delay, but that's obviously not the case.
                // Subtract the delay to make the next event fire ever so slightly faster.
                this.lastFixedUpdate = now - (now - this.lastFixedUpdate - this.targetFixedUpdateMS);
                // Lets just tell the method 
                this.fixedUpdate(this.targetFixedUpdate, now); // fixedDeltaTime
            }

            // Update
            this.update(delta, now);

            // The refresh rate is less important, we can be less accurate here.
            if (frameDelta >= this.targetFrameRate)
            {
                this.lastFrame = now - (now - this.lastFrame - this.targetFrameRateMS);
                this.render();
            }
        } catch (err) {
            isPlaying = false;
        }
        this.stopped = !isPlaying;
    }

    onWindowResize() {
        this.canvas.width = document.body.clientWidth;
        this.width = this.canvas.width;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.gameObjects.forEach(gameObject => {
            gameObject.onCanvasResize(this.width, this.height, this.context);
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
                isPlaying = !isPlaying;
                console.log("Is Playing = ", isPlaying);
                if (isPlaying === true) {
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
        newGameObject.onCanvasResize(this.width, this.height, this.context);
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

    onCanvasResize(width, height, ctx) {}
}

class Terrain
{
    static getMinWaveWidth() { return 175; };
    static getMaxWaveWidth() { return 300; };
    static getMinWaveHeight() { return 100; };
    static getMaxWaveHeight() { return 200; };
    constructor() {
        this.x = 0;
        this.y = 150;
        this.length = Math.PI*2;
        this.step = 1;
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        this.waves = [];
        this.furthestX = 0;
        this.randomType = 0;

        window.addEventListener('keydown', this.keyboardInput.bind(this), false);
    }

    update(deltaTime, now) {}
    fixedUpdate(fixedDeltaTime, now){}
    render(ctx) {
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

    onCanvasResize(width, height, ctx) {
        if (this.canvasHeight === width && this.canvasHeight === height) { 
            return;
        }
        this.ctx = ctx;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.resetWaves();
        if (!isPlaying) {
            this.render(ctx);
        }
    }

    resetWaves() {
        // console.log("resetCanvas");
        this.waves.length = 0;
        this.furthestX = 0;
        let index = 0;
        if (index === 0) {
            this.waves.push({
                previous: null,
                next: null,
                x0: 0,
                y0: this.canvasHeight - Terrain.getMinWaveHeight() - 10,
                x1: Terrain.getMinWaveWidth(),
                y1: this.canvasHeight - 10,
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
                waveLine = Terrain.curveLine(prevElement, isHill, this.randomType);
                // this.waves.push(waveLine);
                // waveLine = Terrain.Mirror(waveLine);
            } else {
                waveLine = Terrain.straightLine(prevElement);
            }
            if (waveLine.y1 > this.canvasHeight) waveLine.y1 = this.canvasHeight;
            prevElement.next = waveLine;
            waveLine.previous = prevElement;
            this.waves.push(waveLine);
            this.furthestX = waveLine.x1;
            index++;
        }
    }

    /**
     * Gets the wave which contains worldspace x.
     * @param {float} x the worldspace x of the object.
     * @returns the wave which contains the provided worlspace x.
     */
    getWaveAtPosition(x) {
        for (let i = 0; i < this.waves.length; i++) {
            const element = this.waves[i];
            if (x < element.x1) return element;
        }
    }

    /**
     * Calculates the waveheight by dividing the wave into 5 slices and performing line-line intersection logic on them.
     * @param {*} position position of the object.
     * @param {*} predictedPosition direction of the object.
     * @param {*} wave the wave from which we should start calculating
     */
    static getWaveIntersection(position, predictedPosition, wave) {
        const searchRight = (position.x < predictedPosition.x);
        let currentWave = wave;
        while (currentWave !== null) {
            const waveResult = Terrain.waveIntersection(position, predictedPosition, wave);
            if (waveResult.intersect) {
                return { ...waveResult, wave: currentWave }; // Include the correct wave.
            }
            
            // Continue looking into the direction of the predicted line position
            if (searchRight) {
                currentWave = currentWave.next;
                if (currentWave !== null && predictedPosition.x < currentWave.x0) return waveResult;
            } else {
                currentWave = currentWave.previous;
                if (currentWave !== null && predictedPosition.x > currentWave.x1) return waveResult;
            }
        }
        return { intersect: false };
    }

    static waveIntersection(position, predictedDirection, wave) {
        const waveSegments = Terrain.subdivideWave(wave);
        for (let i = 0; i < waveSegments.length -1; i++) {
            const element = waveSegments[i];
            const intersection = MathExtension.LineIntersection(position, predictedDirection, element, waveSegments[i+1]);
            
            if (intersection.intersect === true) {
                return intersection;
            }
        }
        return { intersect: false };
    }

    /**
     * Subdivides the wave into 5 pieces.
     * @param {*} wave the wave to subdivide
     */
    static subdivideWave(wave) {
        const wavePoints = [];
        // 0,  1,2,3,4,5, 6,
        for (let index = 0; index < 6; index++) {
            let x = MathExtension.Lerp(wave.x0, wave.x1, (index / (6 - 1)));
            // wavePoints
            wavePoints.push({
                x, 
                y: MathExtension.Lerp(wave.y0, wave.y1, MathExtension.SmoothStep(wave.x0, wave.x1, x)) 
            });
        }
        return wavePoints;
    }

    static getWaveHeightAtPosition(x, wave) {
        while (x > wave.x1 && wave.next !== null) wave = wave.next;
        while (x < wave.x0 && wave.previous !== null) wave = wave.previous;
        return MathExtension.Lerp(wave.y0, wave.y1, MathExtension.SmoothStep(wave.x0, wave.x1, x));
    }

    static straightLine(prevLine) {
        let x = prevLine.x1;
        let y = prevLine.y1;
        return {previous: null, next: null, x0: x, y0: y, x1: x + 5, y1: y};
    }

    static curveLine(prevCurve, isHill, type) {
        const x0 = prevCurve.x1;
        const x1 = x0 + MathExtension.Lerp(Terrain.getMinWaveWidth(), Terrain.getMaxWaveWidth(), this.RandomMethod(type)(x0)); //MathExtension.Random01(x0));
        const y0 = prevCurve.y1;
        let y1 = (isHill) 
            ? y0 - MathExtension.Lerp(Terrain.getMinWaveHeight(), Terrain.getMaxWaveHeight(), this.RandomMethod(type)(x1))
            : y0 + MathExtension.Lerp(Terrain.getMinWaveHeight(), Terrain.getMaxWaveHeight(), this.RandomMethod(type)(x1));
        return {previous: null, next: null, x0, y0, x1, y1};
    }

    static mirror(prevCurve) { return { x0: prevCurve.x1, y0: prevCurve.y1, x1: prevCurve.x1 + prevCurve.x1 - prevCurve.x0, y1: prevCurve.y0 }; }

    static RandomMethod(type) {
        switch (type) {
            // Not random
            case 0: return function(v) { return 0.0; };
            // Semi random
            case 1: return function(v) {return MathExtension.Random01(v); }
            // Random
            case 2: return function(v) { return Math.random(); };
            default: return function(v) { return 0.0; };
        }
    }

    keyboardInput(key) {
        const code = key.keyCode;
        if (code === 82) { // 'r'
            this.randomType = 2;
            this.resetWaves();
            if (!isPlaying) {
                this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.render(this.ctx);
            }
        }
        if (code === 84) { // 't'
            this.randomType = 1;
            this.resetWaves();
            if (!isPlaying) {
                this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.render(this.ctx);
            }
        }
        if (code === 89) {// 'y'
            this.randomType = 0;
            this.resetWaves();
            if (!isPlaying) {
                this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.render(this.ctx);
            }
        }
    }
}

class MathExtension {
    static Lerp(p0, p1, t) { return p0 + (p1 - p0) * t; }

    static LerpBetween(x1, x2, t, min, max) { return MathExtension.TryClamp(MathExtension.Lerp(x1, x2, t), min, max); }

    static Unlerp(p0, p1, t) { return (t - p0) / (p1 - p0); }

    static TryClamp(num, min, max) {
        let isClamped = false;
        let distanceOverExtended = 0;
        if (num < min) {
            isClamped = true;
            distanceOverExtended = min - num;
            num = min;
        }
        if (num > max) {
            isClamped = true;
            distanceOverExtended = num - max;
            num = max;
        }
        return { isClamped, result: num, extrapolatedDistance: distanceOverExtended };
    }

    static Clamp (num, min, max) { return Math.min(Math.max(num, min), max); }

    static SmoothStep(p0, p1, t)
    {
        if (t < p0) return 0;
        if (t >= p1) return 1;
        const x = (t - p0) / (p1 - p0);
        return x * x * (3 - 2 * x);
    }

    static DotProduct(x0, y0, x1, y1) { return (x0 * x1 + y0 * y1); }

    static SurfaceNormal(surfaceDir) {
        if (surfaceDir.x < 0)
            return {x: -surfaceDir.y, y: surfaceDir.x};
        return {x: surfaceDir.y, y: -surfaceDir.x};
    }

    static Reflect(inDir, surfaceNormal) {
        const d = MathExtension.DotProduct(inDir.x, inDir.y, surfaceNormal.x, surfaceNormal.y);
        const factor = -2 * d;
        return {x: factor * surfaceNormal.x + inDir.x,
                y: factor * surfaceNormal.y + inDir.y};
    }

    /**
     * Multiply Rad by this value in order to get degrees.
     */
    static Rad2Degree() { return 180/Math.PI };

    /**
     * Calculates the angle between two vectors.
     * @param {*} p0 Normalized vector
     * @param {*} p1 Normalized vector
     * @returns the angle in radians.
     */
    static Angle(p0, p1) { return Math.acos(MathExtension.DotProduct(p0.x, p0.y, p1.x, p1.y)); }

    static Magnitude(vec) { return Math.sqrt(vec.x * vec.x + vec.y * vec.y); }

    static Normalize(x, y) {
        if (x === 0 && y === 0) return { x:0, y:0 };
        const length = Math.sqrt(x * x + y * y);
        return { x:(x / length), y:(y / length) };
    }

    static LineIntersection(p0, p1, p2, p3) {
        const s1_x = p1.x - p0.x;
        const s1_y = p1.y - p0.y;
        const s2_x = p3.x - p2.x;
        const s2_y = p3.y - p2.y;
        const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
        const t = ( s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) { 
            // Collision detected
            const x = p0.x + (t * s1_x);
            const y = p0.y + (t * s1_y);
            return { intersect:true, position: {x,y}};
        } 
        return { intersect:false, position: {} }; // No collision 
    }

    static Random01(p0) {
        // return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        return (Math.sin(MathExtension.DotProduct(p0, 0, 12.9898, 78.233)) * 43758.5453) % 1;
    }
}

class Player {
    constructor(terrain) {
        // Last fixed update positions
        this.position = {x: 300, y: 230 }; // x: 177
        // Interpolation
        this.iPosition = this.position;
        // Interpolation limits
        this.iMaxX = terrain.canvasWidth -1;
        this.iMaxY = 999999;
        this.iMinX = 0;
        this.iMinY = -100;

        // Predicted location before the next fixedUpdate
        this.predictedPosition = {x: this.position.x, y: this.position.y };
        this.predictedFloorHeight = 999999;
        this.waveIntersectionResult = { intersect: false };
        this.collisionPoint = null; // Unused
        this.floorSlopeDir = {x:0, y:1};
        this.floorNormal = {x:1, y:0};
        this.floorReflectionDir = { x:0, y:1 };

        // Velocity
        this.velocity = { x: 0, y: 0 };
        this.velocityMultiplier = 40;
        this.isGrounded = false;
        this.terrain = terrain;

        this.lastFixedUpdate = 0;
        this.predictedNextFixedUpdate = 0;
        this.fixedDeltaTime = 0;

        // Variables
        this.mass = 25;
        /** The amount of momentum loss on a bounce. 0-1, 1 = no loss. */
        this.bounciness = .9;
        /** The amount of velocity lost per update. The % of friction subtracted from velocity each frame.  */
        this.friction = .5;
        /** The amount pixels allowed before the object is considered Grounded */
        this.groundedTolerance = 3;
        /** The minimum amount of degrees required in order to bounce */
        this.requiredBounceAngle = 50;
        /** The minimum amount of speed required in order to bounce */
        this.requiredBounceMagnitude = 4;
        /** The minimum amount of speed required before it idle */
        this.requiredMagnitude = 2.5;

        window.addEventListener('mousedown', this.mouseInput.bind(this), false);
        window.addEventListener('touchstart', this.mouseInput.bind(this), false);
    }

    update(deltaTime, now) {
        // Get the time between previous and now
        let t = MathExtension.Unlerp(this.lastFixedUpdate, this.predictedNextFixedUpdate, now);

        // Interpolate between previous fixed update and the next one
        // Note: do not use predictedX/Y since these will be changed soon.
        let lerpX = MathExtension.LerpBetween(this.position.x, this.position.x + this.velocity.x * this.velocityMultiplier * this.fixedDeltaTime, t, this.iMinX, this.iMaxX);
        let lerpY = MathExtension.LerpBetween(this.position.y, this.position.y - this.velocity.y * this.velocityMultiplier * this.fixedDeltaTime, t, this.iMinY, this.iMaxY);
        // If the value was clamped it means we've hit something, and should get the next direction/velocity.
        if (lerpX.isClamped || lerpY.isClamped) {
            // TODO: check if there is a next redirection available.
            // console.log(lerpX.extrapolatedDistance, lerpY.extrapolatedDistance);
            // Use the overextended distance to displace the object in the new direction
            // 
        }
        this.iPosition = {
            x: lerpX.result,
            y: lerpY.result,
        };
    }
    
    fixedUpdate(fixedDeltaTime, now) {
        // console.log("Last: ", this.lastFixedUpdate, " Predicted: ", this.predictedNextFixedUpdate, " Actual:", now);
        this.fixedDeltaTime = fixedDeltaTime;
        this.lastFixedUpdate = now;
        this.predictedNextFixedUpdate = now + fixedDeltaTime * 1000;

        const gravityForce = 0.981 * this.mass * fixedDeltaTime;
        const isGrounded = (this.iPosition.y > this.predictedFloorHeight - this.groundedTolerance);
        const isHorizontalSurface = this.floorSlopeDir.y === 0;
        let vMagnitude = MathExtension.Magnitude(this.velocity);

        // Using the intersection results of the previous update.
        if (!isGrounded) {
            this.velocity.y -= gravityForce;
            this.isGrounded = false;
            // console.log("  airborne");
        } else {
            // Flip slopedir around since Y is flipped in the canvas.
            let slopeDir = this.floorSlopeDir;
            slopeDir.y = -slopeDir.y;
            const modifier = (slopeDir.y > 0) ? -1 : 1;
            const vDir = MathExtension.Normalize(this.velocity.x, -this.velocity.y);
            const reflectionAngle = MathExtension.Angle(this.floorReflectionDir, vDir) * MathExtension.Rad2Degree();

            // console.log(reflectionAngle);
            if (reflectionAngle < this.requiredBounceAngle || vMagnitude < this.requiredBounceMagnitude || (this.isGrounded && slopeDir.y > 0)) {
                // Align velocity with the surface 
                this.velocity = {
                    x: slopeDir.x * vMagnitude,
                    y: slopeDir.y * vMagnitude,
                }

                let slopeForces = {
                    x: slopeDir.x * modifier * gravityForce,
                    y: slopeDir.y * modifier * gravityForce,
                }
                if (isHorizontalSurface) {
                    slopeForces = { x: 0, y: 0};
                }

                this.velocity = {
                    x: this.velocity.x + slopeForces.x,
                    y: this.velocity.y + slopeForces.y,
                }
                this.isGrounded = true;
            } else {
                // this.velocity.y += gravity;
                // vMagnitude += gravityForce;
                // console.log("Bouncing...");
                this.velocity = {
                    x: this.floorReflectionDir.x * vMagnitude * this.bounciness,
                    y: -this.floorReflectionDir.y * vMagnitude * this.bounciness,
                };
                this.isGrounded = false;
            }
        }

        // Apply drag
        let drag = {
            x: this.velocity.x - (this.velocity.x * (1 - fixedDeltaTime * this.friction)),
            y: this.velocity.y - (this.velocity.y * (1 - fixedDeltaTime * this.friction)),
        }

        this.velocity.x -= drag.x; // (this.velocity.x * (1 - this.fixedDeltaTime * 1)); //- 1 * (1/this.fixedDeltaTime));
        this.velocity.y -= drag.y; //- 1 * (1/this.fixedDeltaTime));
        vMagnitude = MathExtension.Magnitude(this.velocity);

        if (isGrounded && vMagnitude < this.requiredMagnitude && isHorizontalSurface) {
            // console.log("Stopped velocity!");
            this.velocity = {
                x: 0,
                y: 0,
            }
            isPlaying = false;
        }
        // console.log("Velocity gained: +", addedVelocity, " current ", this.velocity);
        // console.log("Velocity mag: ", vMagnitude, " gravity:", gravityForce);


        // Corner bounce
        if (this.iPosition.x >= this.iMaxX || this.iPosition.x <= this.iMinX) {
            this.velocity.x *= -this.bounciness;
        }

        // Prepare interpolation
        this.position = this.iPosition;
        this.predictedPosition = {
            x: this.position.x + this.velocity.x * this.velocityMultiplier * fixedDeltaTime,
            y: this.position.y - this.velocity.y * this.velocityMultiplier * fixedDeltaTime,
        };
        
        // this.collisionPoint

        // Get wave at current position
        this.waveBelow = this.terrain.getWaveAtPosition(this.position.x);

        this.waveIntersectionResult = Terrain.getWaveIntersection(
            this.position, 
            this.predictedPosition,
            this.waveBelow);

        //TODO: update this logic below to be accurate
        
        // Update the predicted results with more accurate data.
        if (this.waveIntersectionResult.intersect) {
            // console.log("Intersection!");
            // isPlaying = false;
            const yt = MathExtension.Unlerp(this.position.y, this.predictedPosition.y, this.waveIntersectionResult.y);
            this.predictedPosition = this.waveIntersectionResult.position;
            this.predictedPosition.y -= 0.1;

            // this.predictedFloorHeight = this.waveIntersectionResult.position.y;
            // MathExtension.Unlerp(this.position)
        }
        
        // Calculate the height of the floor, and it's slope
        const horizontalDirection = (this.velocity.x > 0) ? 1 : -1;
        this.predictedFloorHeight = Terrain.getWaveHeightAtPosition(this.predictedPosition.x, this.waveBelow);
        let nextPredictedFloor = Terrain.getWaveHeightAtPosition(this.predictedPosition.x + horizontalDirection, this.waveBelow);

        this.iMaxY = this.predictedFloorHeight;
        this.floorSlopeDir = MathExtension.Normalize(horizontalDirection, nextPredictedFloor - this.predictedFloorHeight);
        this.floorNormal = MathExtension.SurfaceNormal(this.floorSlopeDir);
        this.floorReflectionDir = MathExtension.Reflect(MathExtension.Normalize(this.velocity.x, -this.velocity.y), this.floorNormal);
        
        // For testing only.
        this.mouseDirection = MathExtension.Normalize(this.predictedPosition.x - mousePosition.x, this.predictedFloorHeight - mousePosition.y);
    }

    render(ctx) {
        this.canvas = ctx;
        const defaultColor = "black"
        const playerColor = "purple";
        // Draw player
        ctx.beginPath();
        ctx.arc(this.iPosition.x, this.iPosition.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();

        if (Debug)
        {
            // Variables
            const lineLength = 100;
            const velocityColor = "black";
            const surfaceRightColor = "red";
            const surfaceUpColor = "yellow"; 
            const reflectionDirColor = "blue";
            const waveCollider = "purple";
            const intersectionColor = "pink";
            const mouseColor = "green";
            ctx.lineWidth = 5;
            
            // Draw direction + velocity
            // ctx.beginPath();
            // ctx.strokeStyle = velocityColor;
            // ctx.moveTo(this.iPosition.x, this.iPosition.y);
            // ctx.lineTo(this.predictedPosition.x, this.predictedPosition.y);
            // ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = "green";
            ctx.moveTo(this.iPosition.x, this.iPosition.y);
            ctx.lineTo(this.iPosition.x + this.velocity.x * 50, this.iPosition.y + -this.velocity.y * 50);
            ctx.stroke();


            // Draw ghost
            // ctx.beginPath();
            // ctx.arc(this.predictedPosition.x, this.predictedPosition.y, 10, 0, Math.PI * 2);
            // ctx.fillStyle = "rgba(123, 123, 123, 0.7)";
            // ctx.fill();

            // Draw slopeDirection
            // ctx.beginPath();
            // ctx.strokeStyle = surfaceRightColor;
            // ctx.moveTo(this.predictedPosition.x, this.predictedFloorHeight);
            // ctx.lineTo(this.predictedPosition.x + this.floorSlopeDir.x * lineLength, this.predictedFloorHeight + this.floorSlopeDir.y * lineLength);
            // ctx.stroke();

            // Draw surfacenormal
            // ctx.beginPath();
            // ctx.strokeStyle = surfaceUpColor;
            // ctx.moveTo(this.predictedPosition.x, this.predictedFloorHeight);
            // ctx.lineTo(this.predictedPosition.x + this.floorNormal.x * lineLength, this.predictedFloorHeight + this.floorNormal.y * lineLength);
            // ctx.stroke();

            // Draw reflection
            ctx.beginPath();
            ctx.strokeStyle = reflectionDirColor;
            ctx.moveTo(this.predictedPosition.x, this.predictedFloorHeight);
            ctx.lineTo(this.predictedPosition.x + this.floorReflectionDir.x * lineLength, this.predictedFloorHeight + this.floorReflectionDir.y * lineLength);
            ctx.stroke();

            // Draw wave
            // let waveSegments = Terrain.SubdivideWave(this.waveBelow);
            // ctx.beginPath();
            // ctx.strokeStyle = waveCollider;
            // ctx.lineWidth = 3;
            // ctx.moveTo(waveSegments[0].x, waveSegments[0].y);
            // for (let index = 1; index < waveSegments.length; index++) {
            //     const element = waveSegments[index];
            //     ctx.lineTo(element.x, element.y);
            // }
            // ctx.stroke();

            // Draw intersection (if there is any)
            // if (this.waveIntersectionResult.intersect) {
            //     ctx.beginPath();
            //     ctx.strokeStyle = intersectionColor;
            //     ctx.moveTo(this.waveIntersectionResult.position.x, this.waveIntersectionResult.position.y);
            //     ctx.lineTo(this.waveIntersectionResult.position.x + 100, this.waveIntersectionResult.position.y);
            //     ctx.stroke();
            // }

            // Draw path to mouse:
            // ctx.beginPath();
            // ctx.strokeStyle = mouseColor;
            // ctx.moveTo(this.predictedPosition.x - this.mouseDirection.x * 50, this.predictedFloorHeight - this.mouseDirection.y * 50);
            // ctx.lineTo(this.predictedPosition.x, this.predictedFloorHeight);
            // ctx.stroke();
        }
        ctx.strokeStyle = defaultColor;
        ctx.fillStyle = defaultColor;
        ctx.lineWidth = 1;
    }

    onCanvasResize(width, height, ctx) {
        this.iMaxX = width;
    }

    mouseInput() {
        this.position = mousePosition;
        this.iPosition = mousePosition;
        this.velocity = { x:0, y:0 };
        isPlaying = true;
    }
}

let mousePosition = {x:0, y:0};
function getMousePos(e) {
    const canvas = document.getElementById("gameWindow");
    const rect = canvas.getBoundingClientRect();
    mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function getFingerPos(e) {
    const canvas = document.getElementById("gameWindow");
    const rect = canvas.getBoundingClientRect();
    mousePosition = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
    };
}

function startGame() {
    const game = new Game(144, 20);
    const terrain = new Terrain();
    // game.addGameobject(new FPSCounter(game));
    game.addGameobject(terrain);
    game.addGameobject(new Player(terrain));
    
    onmousemove = getMousePos;
    ontouchmove = getFingerPos;
}
const Debug = false;
let isPlaying = false;
startGame();