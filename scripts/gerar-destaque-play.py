# Gera a imagem de destaque do Google Play (1024 × 500, sem transparência).
# Fundo = gradiente do onboarding (03-DESIGN), mascote à direita, nome e frase à esquerda.
from PIL import Image, ImageDraw, ImageFont

L, A = 1024, 500
F = 'node_modules/@expo-google-fonts/poppins'
topo, base = (0x0B, 0x1E, 0x44), (0x14, 0x31, 0x5F)

img = Image.new('RGB', (L, A))
d = ImageDraw.Draw(img)
for y in range(A):
    t = y / (A - 1)
    d.line([(0, y), (L, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(topo, base)))

mascote = Image.open('assets/images/nero/mascote-nero.png').convert('RGBA')
mascote = mascote.crop(mascote.getbbox())
h = 440
mascote = mascote.resize((round(mascote.width * h / mascote.height), h), Image.LANCZOS)
img.paste(mascote, (L - mascote.width - 70, A - h), mascote)

titulo = ImageFont.truetype(f'{F}/800ExtraBold/Poppins_800ExtraBold.ttf', 76)
frase = ImageFont.truetype(f'{F}/500Medium/Poppins_500Medium.ttf', 30)
x = 72
d.text((x, 150), 'Nero Saúde', font=titulo, fill='white')
d.text((x, 262), 'Pressão, glicemia, remédios', font=frase, fill=(0x75, 0xD7, 0xE9))
d.text((x, 304), 'e exames num só lugar.', font=frase, fill=(0x75, 0xD7, 0xE9))

img.save('assets/images/loja/destaque-play-1024x500.png', optimize=True)
print(img.size, img.mode)
