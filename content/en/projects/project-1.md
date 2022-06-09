---
date: 2022-05-25T09:48:59-04:00 
description: "A project that started as a triangle, and ended as a world"
featured_image: "https://i.imgur.com/jNQktl3.jpg"
tags: ["Programming"]
title: "Procedural terrain generation"
show_reading_time: true
---

Like many around my age, I grew up when minecraft was still a brand new thing.\
Inspired by it's grand and amazing worlds I wanted to create something like it for the longest time.
During one of my courses at Amsterdam University of Applied Sciences (AUAS) we were tasked to create a procedurally generated object. While this was only meant to be a simple object, I quickly became invested in this technology.

What started off as a simple line between two points, grew into a triangle and from there the possibilities seemed endless.
{{< remoteVideo src=`https://i.imgur.com/BMAqco3.mp4` autoplay=`false` style=`width:100%;` >}}
{{< href url=`https://github.com/Westhes/Procedural-Mesh-Generation` text=`Github - Procedural Mesh Generation`>}}

Motivated by the initial triangle I wanted to start working on a full fledged terrain generator.
As mentioned before, minecraft was a big inspiritation, and also a great resource of which I could learn.
Hence why I early on already realized that in order to draw blocks, I shouldn't be looking for which blocks are opaque, but rather for which ones are transparent, since any neighbor of a transparent blocks would be visible.

Based off this knowledge I created the following dataset.

{{< remoteImage src=`https://i.imgur.com/RpwlNBw.jpg` style=`width:100%;`>}}
This dataset consisted of a 5x5x5 matrix in which 3 diagonal neighboring cells were transparent, and the rest were solid.
This allowed me to efficiently test against a variety of challenges:
1. Duplicate vertices.
2. Frontface culling.
3. Different Block types

Throughout the week that I had worked on this, I also tackled and implemented other challenges such as controlled randomness in the form of perlin noise and chunks. Which is the reason how I managed to create this already spectacular looking terrain.

{{< remoteVideo src=`https://i.imgur.com/iw4fiiW.mp4` autoplay=`false` style=`width:100%;` >}}
{{< href url=`https://github.com/Westhes/Procedural-Terrain-Generation` text=`Github - Procedural Terrain Generation`>}}

And that's where the project is left at, it's not finished. A terrain generator like this can always be expanded upon and always be improved upon. But for the week I spend on this, I accomplished and overcame quite a lot of technical challenges.
Waaay past the scope and requirements of the assignment. ;)