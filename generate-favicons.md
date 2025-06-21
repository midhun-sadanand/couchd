# Favicon Generation Guide

To get your favicon to show up properly when links are shared via text or social media, you need to create several favicon files. Here's how to do it:

## Required Files

1. **favicon.ico** - Traditional favicon format (16x16, 32x32, 48x48 pixels)
2. **apple-touch-icon.png** - For iOS devices (180x180 pixels)
3. **og-image.png** - Open Graph image for social sharing (1200x630 pixels)

## How to Generate These Files

### Option 1: Online Tools (Recommended)

1. **favicon.io** - Upload your favicon.svg and it will generate all formats
2. **realfavicongenerator.net** - More comprehensive favicon generator
3. **Canva** - Create the og-image.png (1200x630px) for social sharing

### Option 2: Command Line (if you have ImageMagick)

```bash
# Convert SVG to ICO
convert public/favicon.svg -resize 32x32 public/favicon.ico

# Convert SVG to Apple Touch Icon
convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png

# Create Open Graph image (you'll need to design this)
# Recommended size: 1200x630 pixels
```

### Option 3: Manual Creation

1. Open your favicon.svg in a vector editor (Inkscape, Figma, etc.)
2. Export as PNG in the required sizes
3. Use an online converter to create the .ico file

## File Placement

Place all generated files in your `public/` directory:
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/og-image.png`

## Testing

After adding the files, test your social sharing:

1. **Facebook**: Use https://developers.facebook.com/tools/debug/
2. **Twitter**: Use https://cards-dev.twitter.com/validator
3. **LinkedIn**: Use https://www.linkedin.com/post-inspector/

## Update Your Domain

Don't forget to update the `url` field in your layout.tsx with your actual domain name! 