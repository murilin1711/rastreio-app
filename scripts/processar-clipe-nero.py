"""Uso: python3 processar-clipe.py <frames_dir> <saida.webp> <ini> <fim> <loop 0|1> [fps] [altura] [q]
Recorta a silhueta do Nero (fundo bege do gerador), corta o rodapé (marca d'água), enquadra igual ao clipe de repouso e gera WebP animado."""
import sys, glob, os, shutil, subprocess
from PIL import Image, ImageFilter; import numpy as np
from scipy import ndimage as ndi
d_frames, saida, ini, fim, loop = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
fps = int(sys.argv[6]) if len(sys.argv) > 6 else 20; alt = int(sys.argv[7]) if len(sys.argv) > 7 else 360; q = sys.argv[8] if len(sys.argv) > 8 else '75'
Y0, Y1, CX = 185, 1100, 343
LIM_CORPO = float(os.environ.get('LIM_CORPO', '14'))   # distância mínima do bege para contar como corpo (fundo fica abaixo de ~10)   # enquadramento vertical e centro horizontal iguais ao repouso
# Fechamento da silhueta. Partes do personagem chegam a ter a cor exata do fundo (a face inferior da mão
# ao acenar: distância de cor 0), abrindo buracos que escapam pela fresta entre a mão e a cabeça e por isso
# sobrevivem ao fill_holes. Fechar com 5 os elimina sem engordar o contorno; 2 mantém os clipes antigos.
FECHAMENTO = int(os.environ.get('FECHAMENTO', '2'))
fs = sorted(glob.glob(d_frames + '/*.png'))[ini:fim + 1]
BG = np.array(Image.open(fs[0]).convert('RGB'))[10, 10].astype(float)
def silhueta(f):
    a = np.array(Image.open(f).convert('RGB')).astype(float)
    d = np.linalg.norm(a - BG, axis=2)
    lim = np.full(d.shape, LIM_CORPO); lim[960:] = 22.0; lim[1000:] = 34.0
    hard = d > lim; hard[1120:] = False
    # fechamento forte só acima do chão: embaixo ele gruda a sombra na silhueta e estraga a medida das pernas
    forte, base = ndi.binary_closing(hard, iterations=FECHAMENTO), ndi.binary_closing(hard, iterations=2)
    hard = np.concatenate([forte[:940], base[940:]])
    hard = ndi.binary_fill_holes(hard)
    lab, n = ndi.label(hard)
    if n > 1: hard = lab == (np.argmax(ndi.sum(hard, lab, range(1, n + 1))) + 1)
    fg = Image.fromarray(hard.astype(np.uint8) * 255, 'L').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    return a, np.array(fg).astype(float) / 255
frames = [silhueta(f) for f in fs]
if os.environ.get('MEDIANA_T', '1') == '1':
    als = np.stack([al for _, al in frames]); als = ndi.median_filter(als, size=(3, 1, 1), mode='nearest')
    frames = [(a, als[i]) for i, (a, _) in enumerate(frames)]
# Sombra lateral no chão (ex.: sombra do braço ao acenar): mantém no chão só a largura das pernas + margem, medida UMA vez no frame 0
pernas = np.where(frames[0][1][950:990] > 0.5)[1]
if pernas.size:
    x_esq, x_dir = max(pernas.min() - 30, 0), min(pernas.max() + 30, 720)
    for _, al in frames:
        al[960:, :x_esq] = 0; al[960:, x_dir:] = 0
meio = max(max(abs(np.where(al > 0.5)[1].min() - CX), abs(np.where(al > 0.5)[1].max() - CX)) for _, al in frames) + 24
x0, x1 = max(CX - meio, 0), min(CX + meio, 720)
fr = [np.dstack([a[Y0:Y1, x0:x1].astype(np.uint8), (al[Y0:Y1, x0:x1] * 255).astype(np.uint8)]).astype(float) for a, al in frames]
if loop:
    K = 6
    for i in range(K):
        t = (i + 1) / (K + 1); j = len(fr) - K + i; fr[j] = fr[j] * (1 - t) + fr[i] * t
tmp = os.path.join(os.path.dirname(saida) or '.', '_tmp'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp + '/a')
for i, f in enumerate(fr): Image.fromarray(f.astype(np.uint8), 'RGBA').save(f'{tmp}/a/l{i:03d}.png')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{tmp}/a/l%03d.png', '-vf', f'fps={fps},scale=-2:{alt}:flags=lanczos', f'{tmp}/f%03d.png'], check=True)
pngs = sorted(glob.glob(tmp + '/f*.png'))
subprocess.run(['img2webp', '-loop', '0' if loop else '1', '-d', str(round(1000 / fps)), '-lossy', '-q', q, '-m', '4', '-mixed', *pngs, '-o', saida], check=True, capture_output=True)
im = Image.open(saida); print(f'{os.path.basename(saida)}: recorte x {x0}-{x1}, {im.size[0]}x{im.size[1]}, {im.n_frames} frames, {os.path.getsize(saida)//1024} KB')
shutil.rmtree(tmp)
