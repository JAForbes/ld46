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
