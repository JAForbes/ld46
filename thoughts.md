#### Journal

##### 2020-04-18    10:19 AM 

Getting the basic project setup.  Don't know the current theme.  I want to build something with a lot of UI.

I'm planning to use a UI library I've been working on, we'll see how that goes.

Also planning to use CSS for rendering.  CSS vars for movements, background image for sprite sheets.  I may switch to canvas though.

First step is to just get a basic project going.

##### 2020-04-18    11:12 AM 

Got a basic export process going for aseprite.  Looks like an amazing tool actually. You can export metadata/sclices/specific layers.

My process I think will be to use that tool as much as possible and make the game code just trust whatever metadata is there.  This is the opposite to what I normally do.

##### 2020-04-28    11:47 AM

I've just been watching some tutorials for the sprite app.  And thinking of ideas while havig a coffee or two.  The theme is "keep it alive".  I initially thought of a game where you're protecting an egg from dinosaurs and while you carry the egg you can't attack.

But that's a lot of work.  And I'm not sure the core loop is that fun without a lot of environment to create interest.  It also probably needs some amazing sprite work and animations and I really want to work with UI this time.

I was going to build it all the same, but I just had an idea where you defend a convoy in space.  I've always wanted to make a space game in Ludum Dare, but what pushed me over the edge was seeing the polygon tool in the sprite app, I thought, that could make for some really quick ship design.

Also a space game would probably have a lot of UI, e.g. upgrading weapons/hulls, choosing missions, spending money, potentially a minimap.  There's a lot of UI challenge for sure.

I might change my mind soon, who knows.  I really just want to get a basic workflow with this sprite app going so I can mess around with art assets instead of code when I'm really tired tomorrow.

##### 2020-04-28    12:14 PM

I was thinking I'd have multiple characters/assets in a single aseprite project so I'd only load one sprite sheet.  But it looks like that's not how the software is designed.  So I'll need some process for the JS to know what sprite sheets to load, and what data to load.  Maybe it's all manual but I'd really like this game to be asset driven, so if there's a new asset, it's automatically available.  So if I can get my export script to export multiple projects that'd be amazing.  Oh maybe I'm misunderstanding the export script.  maybe you have separate .aseprite files but you can do a single export with multiple files.  I need to re-read the docs.

Yep, it's right there at the top `FILES...`

```
Usage:
  aseprite.exe [OPTIONS] [FILES]...
```

Ok so I guess each asset has its own project file, which is way easier/nicer.  I'll test that out.

---

Yep totally works.

Because I'm using github pages, I need to check in all these built files.  But that seems really annoying.  I'd prefer to not need to run a build to update the github pages example.  It'd be so much cooler if whatever was in source, was in source.  But if I want this to load quickly, I'm going to minify things anyways, so maybe that's not necessary.  If I'm minifying, I should not check in the minified code, and then that means there's a different process for local as for shipped.

I think for now, I'll check in the frames.json + sheet.png.  And revisit this later...


##### 2020-04-28    12:14 PM

I think I want this game to work with just mouse or touch.  I'll probably add keyboard support as a stretch goal, but I've done that so many times before.

So I'm going to fiddle with hammerjs a bit, and see if I can get an animated sprite move with my touch input.

I've got a vague idea what I want the game to be, but if I can get things feeling nice that's a huge start.

##### 2020-04-28    2:27 PM

I've got hammer working ok.  Took me a while to figure out the API.  The docs are super confusing but the examples make it pretty clear.

Right now I'm looking into menu/ui states.  I feel pretty confident just building some kind of game thing, but getting the UI transitions feeling nice is new for me in a game.  I'm testing on a phone, making sure I can get audio playing and such.  I'm considering forcing people to pin to desktop so the toolbar can be hidden constantly.  I know that's seen as bad practice but that's going to get super annoying when playing.

##### 2020-04-28    3:54 PM

Sounds/Metadata/Images are now loading and there's some basic routing between pages based on game state.  It's just a black screen with some default buttons and images and at 4pm that feels really bad, but considering it's only actually been 5 hours out of 48, it's okay.  There's still 43 to go.  And these are the sort of things that really bothered me in previous entries.  Can probably serve as a bit of a template for future jams.

So my next task is to render these sprites based on the frames.json and to be able to select applicable animations based on tags.  From there I should be able to do things like tell the game to render the ship flying, with the guns shooting.

The interesting part will be, overlapping layers playing different animations independently.

So for example, if I have a ship, and there's a section called `accelerating` and it's got some engines lit up, but then I've got another section called `shooting` and the guns light up, well then I want to be able to shoot and accelerate at the same time.  So I want to be able to know which layers to update/render when accelerating, and which ones not to.

---

Just walked around a bit and though about that.  I don't think aseprite's data model will give me what I need.  But layers can.  So if I use frame tags as just positions/directions.  And then use layers for actions I think it's doable.

Different types of weapons could be doable, but not sure if I'll bother in the jam.  It'd be a different project file.

##### 2020-04-28    20:01 PM

The system to establish which tiles to render on screen is sort of ready to go.  But I don't want to accidentally reset an animation by presuming that just because the particular condition that triggered a cycle just started, that a separate cycle hadn't also just ended that used the same animation.

I think I need to store the `title+layer+tag` that are currently rendering, irrespective of why, and when they started.  That way I can pick the correct frame.

So I guess the first thing to do is figure out the unique set of `title+layer+tag` that has to render, and then check if they are already rendering.
If they are resume, if not start.

Same goes for sounds too I guess.

##### 2020-04-28    21:13 PM

Thinking about sounds now.  Sometimes you want a sound to repeat indefinitely, e.g. while moving with thrusters on.  Sometimes you want a sound to play intermittently, or repeat at a certain rate.  E.g. firing a cannon, you want to process the sound one time for every shot.

So I'm wondering if the system that triggers sound for firing shots, is the same as the system for rendering images.

And for the shot, it's kind of easier to set repeat false, and have a shot sprite that is just added to rendering, actions is Base and there's no tag filter.  Then when the image is created, the sound is created.

For machine guns, there's no bullet.  It's more of a repeating effect, and at that point, yeah you probably want to just have a repeating shoot noise, it doesn't need to be synced up with a bullet firing.

So I guess next steps would be, get a looping sound for thrusters, a looping sound for some kind of repeater gun / laser.  And a once off sound for a cannon.

At that point I have images+sound.  Then I can either work on a dead simple menu, or the camera.

I think for this game I need to have some AI that is basically, ships generally following a set path but they'll follow me if I get too far away from the path.  Ships can get damaged and then I need to cover them while they repair.  There can be more than 1 ship and one keeps moving while the other repairs, and maybe you need to fly near a ship to issue a stop command.

Then there's also AI that is attacking me, and AI that is attacking the ships.

By the end of the jam, if I can just get one level done, that would be amazing.  I think additional levels wouldn't be too hard once one level is done, so I'm happy at that point.  But if I don't have some half decent UI/screen shake/juice I don't really care if there's a lot of levels.

There's also serialization.  I've been careful to separate serializable and non-serializable state.  E.g. canvases/images/sounds are stored separately to game state.  So I feel like a refresh shouldn't just completely restart the game, but, also, not a big deal for a 48 hour jam.

While I was typing that I was thinking, repeat can be a rate.

So for guns I can say, repeat every 100ms, if the sound effect takes 100ms, that's gapless playback.  Then I don't really want to know how long a sound goes for, so I can represent that as a ratio, e.g. repeating gaplessly could be 1, as in repeat every `duration * 1`, repeating never could be `0`.  Repeating ever 200ms could be `repeatRate: 2`.  That might seem confusing, but I think models what I need to model pretty simply.

##### 2020-04-28    23:37 PM

Took a break for an hour, then came back and just generated a bunch of sounds.  My brain wasn't ready for code.  It felt good even though I know I was procrastinating.  At this point my game is just a single repeating sprite, but there's a lot of potential in this system once I start iterating on art.  I might give the code a break and just art it up tomorrow morning.

I also think I understand sfxr/bfxr/jfxr a bit better, I was actually tuning the dials finessing the effects I wanted.  Getting a low repeating engine hum was difficult, especially getting a perfect loop.  But I think I've got enough to achieve some ambience without blowing out the filesize.

I might have a 2-3 hour sleep.  Wake up at 2-3 am and just do some art.  We'll see.  My brain might be ready to code the sound system.  I'd really like the system to change volume based on distance for some effects.  I've done that before and it added a lot of immersion.  I think it would be especially important for this kind of game.

Also was thinking of names.  The best I came up with so far was convoyage.  As in "bon voyage" as "convoy" as a kind of tongue in cheek name implying the convoy's your protecting aren't likely to survive.