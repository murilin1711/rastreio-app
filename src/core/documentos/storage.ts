import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@core/supabase/client';
import { ErroNero, traduzirErro } from '@core/supabase/erros';
import { caminhoNoBucket } from './mapeamento';
import { LIMITE_BYTES } from './tipos';

export interface ArquivoEscolhido { uri: string; mime: string; nome: string; largura?: number }

/** Câmera ou galeria (expo-image-picker). Devolve null se o usuário cancelar ou negar permissão. */
export async function escolherImagem(origem: 'camera' | 'galeria'): Promise<ArquivoEscolhido | null> {
  const perm = origem === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted') throw new ErroNero(origem === 'camera' ? 'Permita o uso da câmera nas configurações do celular para fotografar o laudo.' : 'Permita o acesso às fotos nas configurações do celular para escolher a imagem.', null);
  const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: false };
  const r = origem === 'camera' ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, mime: a.mimeType ?? 'image/jpeg', nome: a.fileName ?? 'imagem.jpg', largura: a.width };
}

export async function escolherPdf(): Promise<ArquivoEscolhido | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, mime: a.mimeType ?? 'application/pdf', nome: a.name };
}

/** Reduz imagens grandes (largura > 2000 px) e recomprime em JPEG 0,8 (D-008). */
export async function comprimirImagem(a: ArquivoEscolhido): Promise<ArquivoEscolhido> {
  if (!a.mime.startsWith('image/')) return a;
  const acoes = a.largura && a.largura > 2000 ? [{ resize: { width: 2000 } }] : [];
  const r = await ImageManipulator.manipulateAsync(a.uri, acoes, { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: r.uri, mime: 'image/jpeg', nome: a.nome.replace(/\.[^.]+$/, '') + '.jpg', largura: r.width };
}

/** Envia ao bucket privado 'laudos' na pasta do usuário; devolve caminho e tamanho. */
export async function enviar(userId: string, a: ArquivoEscolhido): Promise<{ caminho: string; tamanho: number; mime: string }> {
  const resposta = await fetch(a.uri);
  const blob = await resposta.blob();
  if (blob.size > LIMITE_BYTES) throw new ErroNero('Arquivo maior que 10 MB. Tire uma foto com menos resolução ou escolha um PDF menor.', null);
  const uuid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const caminho = caminhoNoBucket(userId, uuid, a.mime, a.nome);
  const arrayBuffer = await new Response(blob).arrayBuffer();
  const { error } = await supabase.storage.from('laudos').upload(caminho, arrayBuffer, { contentType: a.mime, upsert: false });
  if (error) throw traduzirErro(error);
  return { caminho, tamanho: blob.size, mime: a.mime };
}

/** Leitura sempre por URL assinada curta (1 h) — nada é público. */
export async function urlAssinada(caminho: string, segundos = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from('laudos').createSignedUrl(caminho, segundos);
  if (error) throw traduzirErro(error);
  return data.signedUrl;
}

export async function apagarArquivo(caminho: string): Promise<void> {
  const { error } = await supabase.storage.from('laudos').remove([caminho]);
  if (error) throw traduzirErro(error);
}
