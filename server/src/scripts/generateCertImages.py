"""Generate Grow Wealth certificate PNGs (classic + modern)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path(__file__).resolve().parents[3] / 'client' / 'public' / 'certificates'
OUT.mkdir(parents=True, exist_ok=True)
DOWNLOADS = Path.home() / 'Downloads'


def font(size, bold=False):
    candidates = [
        'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/calibrib.ttf' if bold else 'C:/Windows/Fonts/calibri.ttf',
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def script_font(size):
    for p in [
        'C:/Windows/Fonts/seguisb.ttf',
        'C:/Windows/Fonts/comic.ttf',
        'C:/Windows/Fonts/ITCEDSCR.TTF',
        'C:/Windows/Fonts/FRSCRIPT.TTF',
        'C:/Windows/Fonts/segoeui.ttf',
    ]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return font(size)


def italic_font(size):
    for p in ['C:/Windows/Fonts/ariali.ttf', 'C:/Windows/Fonts/segoeuii.ttf', 'C:/Windows/Fonts/calibrii.ttf']:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return font(size)


def center_text(draw, text, y, fnt, fill, W):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, y), text, font=fnt, fill=fill)


def wrap_text(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ''
    for w in words:
        test = (cur + ' ' + w).strip()
        if draw.textbbox((0, 0), test, font=fnt)[2] <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def make_classic():
    W, H = 1200, 848
    img = Image.new('RGB', (W, H), '#f97316')
    draw = ImageDraw.Draw(img)

    # orange→blue side gradient frame
    for y in range(H):
        t = y / (H - 1)
        r = int(249 + (29 - 249) * t)
        g = int(115 + (78 - 115) * t)
        b = int(22 + (216 - 22) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    pad = 14
    draw.rectangle([pad, pad, W - pad, H - pad], fill='#ffffff')

    # subtle watermark stripes
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(-H, W + H, 40):
        od.line([(i, pad), (i + H, H - pad)], fill=(37, 99, 235, 10), width=18)
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    center_text(draw, 'GROW WEALTH CERTIFICATION BOARD', 70, font(26, True), '#222938', W)
    center_text(draw, 'The Board of Directors hereby awards', 115, italic_font(20), '#4b5568', W)
    center_text(draw, 'Grow Wealth Platform', 175, script_font(58), '#111827', W)
    center_text(draw, 'the credential of', 255, font(16), '#6b7280', W)
    center_text(draw, 'Certified Digital Asset Professional', 290, font(30, True), '#0f172a', W)

    body = (
        'Having agreed to uphold the Code of Ethics and Operations Standard, and having completed '
        'the competency examination for USDT BEP-20 staking systems, this credential remains valid '
        'subject to annual review.'
    )
    bf = font(15)
    lines = wrap_text(draw, body, bf, 760)
    y = 350
    for line in lines:
        center_text(draw, line, y, bf, '#4b5563', W)
        y += 24

    # seal
    seal = Image.new('RGBA', (56, 56), (0, 0, 0, 0))
    sd = ImageDraw.Draw(seal)
    sd.rounded_rectangle([0, 0, 55, 55], radius=10, fill=(37, 99, 235, 255))
    for i in range(56):
        t = i / 55
        # orange to blue
        sd.line([(0, i), (55, i)], fill=(int(249 * (1 - t) + 37 * t), int(115 * (1 - t) + 99 * t), int(22 * (1 - t) + 235 * t), 255))
    img.paste(seal.convert('RGB'), (70, 620), seal)

    draw.text((140, 625), 'GROW WEALTH', font=font(14, True), fill='#111827')
    draw.text((140, 648), 'CERTIFICATION BOARD', font=font(11), fill='#6b7280')

    meta_x = W - 80
    for i, t in enumerate(['Issued: 2025-01-15', 'Certificate No: GW-DAP-8F2A91']):
        bbox = draw.textbbox((0, 0), t, font=font(13))
        draw.text((meta_x - (bbox[2] - bbox[0]), 620 + i * 22), t, font=font(13), fill='#374151')

    badge = Image.new('RGBA', (52, 52), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    for i in range(52):
        t = i / 51
        bd.line([(0, i), (51, i)], fill=(int(249 * (1 - t) + 37 * t), int(115 * (1 - t) + 99 * t), int(22 * (1 - t) + 235 * t), 255))
    bd.rounded_rectangle([0, 0, 51, 51], radius=8, outline=(255, 255, 255, 0))
    # redraw rounded badge properly
    badge = Image.new('RGBA', (52, 52), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    bd.rounded_rectangle([0, 0, 51, 51], radius=8, fill=(37, 99, 235, 255))
    # gradient overlay
    for i in range(52):
        t = i / 51
        color = (int(249 * (1 - t) + 37 * t), int(115 * (1 - t) + 99 * t), int(22 * (1 - t) + 235 * t), 255)
        for x in range(52):
            # keep only inside rounded-ish box via mask later
            pass
    badge2 = Image.new('RGBA', (52, 52), (0, 0, 0, 0))
    b2 = ImageDraw.Draw(badge2)
    b2.rounded_rectangle([0, 0, 51, 51], radius=8, fill=(249, 115, 22, 255))
    b2.rounded_rectangle([0, 20, 51, 51], radius=8, fill=(37, 99, 235, 255))
    tb = font(14, True)
    bb = b2.textbbox((0, 0), 'DAP', font=tb)
    b2.text(((52 - (bb[2] - bb[0])) / 2, (52 - (bb[3] - bb[1])) / 2 - 2), 'DAP', font=tb, fill='white')
    img.paste(badge2.convert('RGB'), (W - 120, 670), badge2)

    draw.text((70, 760), 'Verify authenticity: grow-wealth-neon.vercel.app/certificates#GW-DAP-8F2A91', font=font(12), fill='#9ca3af')

    path = OUT / 'certificate-digital-asset-professional.png'
    img.save(path, 'PNG', quality=95)
    img.save(DOWNLOADS / 'GrowWealth-Certificate-Digital-Asset-Professional.png', 'PNG')
    print('saved', path)
    return path


def make_modern():
    W, H = 1200, 848
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)

    # diagonal-ish gradient blue
    for y in range(H):
        for x in range(0, W, 4):
            t = (x / W * 0.45 + y / H * 0.55)
            # #0b1f3a -> #1e3a8a -> #0ea5e9
            if t < 0.5:
                u = t / 0.5
                r = int(11 + (30 - 11) * u)
                g = int(31 + (58 - 31) * u)
                b = int(58 + (138 - 58) * u)
            else:
                u = (t - 0.5) / 0.5
                r = int(30 + (14 - 30) * u)
                g = int(58 + (165 - 58) * u)
                b = int(138 + (233 - 138) * u)
            draw.rectangle([x, y, x + 3, y], fill=(r, g, b))

    # brand
    draw.ellipse([56, 48, 88, 80], outline='white', width=2)
    draw.text((100, 52), 'Grow Wealth', font=font(18, True), fill='white')
    draw.text((56, 105), 'Certified Crypto Trader', font=font(42, True), fill='white')

    draw.line([(56, 175), (W - 56, 175)], fill=(255, 255, 255, 180), width=1)
    # approximate white line
    draw.line([(56, 175), (W - 56, 175)], fill=(220, 230, 245), width=2)

    meta = font(15)
    draw.text((56, 190), 'No: 5984308245245', font=meta, fill=(230, 240, 255))
    draw.text((320, 190), 'Date: 09.07.2025', font=meta, fill=(230, 240, 255))
    draw.text((540, 190), 'Verify: grow-wealth-neon.vercel.app', font=meta, fill=(230, 240, 255))

    draw.text((56, 250), 'Awarded to', font=font(14), fill=(200, 220, 245))
    draw.text((56, 278), 'Grow Wealth Operations', font=font(28, True), fill='white')

    draw.text((620, 250), 'For completing the', font=font(14), fill=(200, 220, 245))
    draw.text((620, 278), 'BEP-20 Staking & Liquidity Program', font=font(22, True), fill='white')
    desc = (
        'The program included fundamental & technical analysis, trading psychology, '
        'DeFi strategies, and yield optimization techniques on USDT BEP-20.'
    )
    df = font(14)
    y = 320
    for line in wrap_text(draw, desc, df, 480):
        draw.text((620, y), line, font=df, fill=(220, 235, 255))
        y += 22

    draw.text((56, 620), '16-Week Intensive Training (72 Hours)', font=font(16, True), fill='white')
    draw.text((56, 645), 'Training Duration', font=font(13), fill=(180, 210, 240))
    draw.text((56, 690), 'Simulated Portfolio Growth: +31%', font=font(16, True), fill='white')
    draw.text((56, 715), 'Performance Metric', font=font(13), fill=(180, 210, 240))

    # signature block right
    sx = W - 360
    draw.text((sx, 620), 'Alexandra R. Hayes', font=font(16, True), fill='white')
    draw.text((sx, 645), 'Director / Senior Analyst', font=font(13), fill=(180, 210, 240))
    draw.text((sx, 680), 'A. Hayes', font=script_font(40), fill='white')
    draw.text((sx, 735), 'Signed: 09.23.2025', font=font(13), fill=(200, 220, 245))

    path = OUT / 'certificate-crypto-trader.png'
    img.save(path, 'PNG')
    img.save(DOWNLOADS / 'GrowWealth-Certificate-Crypto-Trader.png', 'PNG')
    print('saved', path)
    return path


if __name__ == '__main__':
    make_classic()
    make_modern()
    print('Downloads folder:', DOWNLOADS)
