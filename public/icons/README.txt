App icon art
============

Drop your icon art in THIS folder with these exact names:

  icon-192.png    (192x192, used for the home-screen/app icon)
  icon-512.png    (512x512, used for splash screens + app stores)
  icon-maskable.png   (512x512, same art but with extra padding — see below)

All should be square PNGs. If you only have one image, it's fine to use
the same file for icon-192.png and icon-512.png (just save it twice, or at
different sizes if you have them) — icon-maskable.png can also just be a
copy of icon-512.png to start.

About "maskable": Android can crop app icons into a circle/squircle/rounded
square depending on the phone's theme. A maskable icon should have your
main artwork inside the center ~80% of the canvas (safe zone), with the
background color/pattern filling the rest, so nothing important gets
cropped off. If you're not fussed about this yet, a plain copy of
icon-512.png works fine as a placeholder.

Once the files are here, the app is already wired to pick them up — just
refresh. See the `manifest.icons` array in vite.config.ts if you want to
change the file names.
