/** Auxiliares compartilhados dos testes de tela (react-test-renderer). */

/** Texto visível de um nó: as strings soltas em toda a sua descendência. */
export function textoDe(no: any): string {
  if (typeof no === 'string') return no;
  return (no.children ?? []).map(textoDe).join(' ');
}

/** Aciona o `onPress` do primeiro nó pressionável cujo rótulo ou texto bate. */
export function apertar(arvore: any, rotulo: string) {
  const alvo = arvore.root.findAll((n: any) =>
    typeof n.props?.onPress === 'function' && (n.props.label === rotulo || textoDe(n).includes(rotulo)))[0];
  if (!alvo) throw new Error(`não achei "${rotulo}" na tela`);
  alvo.props.onPress();
}
