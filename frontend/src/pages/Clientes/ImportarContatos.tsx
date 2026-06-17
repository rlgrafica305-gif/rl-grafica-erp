import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload, CheckCircle, AlertCircle, Users, Trash2 } from 'lucide-react'
import { api } from '@/services/api'

interface Contato {
  nome: string
  telefone: string
}

function limpaTelefone(t: string): string {
  const num = t.replace(/\D/g, '')
  if (num.startsWith('55') && num.length > 11) return num.slice(2)
  return num
}

function parseVCF(texto: string): Contato[] {
  const contatos: Contato[] = []
  const blocos = texto.split(/BEGIN:VCARD/i).filter(b => b.trim())
  for (const bloco of blocos) {
    let nome = ''
    let telefone = ''
    for (const linha of bloco.split(/\r?\n/)) {
      const l = linha.trim()
      if (/^FN:/i.test(l)) {
        nome = l.replace(/^FN:/i, '').trim()
      } else if (!nome && /^N:/i.test(l)) {
        const partes = l.replace(/^N:/i, '').split(';').map(s => s.trim()).filter(Boolean)
        nome = partes.reverse().join(' ').trim()
      } else if (/^(item\d+\.)?TEL/i.test(l) && !telefone) {
        telefone = limpaTelefone(l.split(':').slice(1).join(':'))
      }
    }
    if (nome) contatos.push({ nome, telefone })
  }
  return contatos
}

function parseCSV(texto: string): Contato[] {
  const linhas = texto.split(/\r?\n/).filter(l => l.trim())
  if (linhas.length < 2) return []

  // Detecta delimitador (vírgula ou ponto e vírgula)
  const delim = linhas[0].includes(';') ? ';' : ','

  const splitLinha = (l: string) =>
    l.split(delim).map(c => c.trim().replace(/^"|"$/g, '').trim())

  const headers = splitLinha(linhas[0]).map(h => h.toLowerCase())

  // Detecta coluna de nome
  const idxNome = headers.findIndex(h =>
    h === 'name' || h === 'nome' || h === 'full name' || h === 'nome completo'
  )
  const idxPrimeiro = headers.findIndex(h => h === 'first name' || h === 'primeiro nome' || h === 'given name')
  const idxUltimo   = headers.findIndex(h => h === 'last name'  || h === 'ultimo nome'   || h === 'family name' || h === 'surname')

  // Detecta coluna de telefone (pega a primeira que tiver "phone" ou "tel" ou "celular" ou "whatsapp")
  const idxTel = headers.findIndex(h =>
    h.includes('phone') || h.includes('tel') || h.includes('celular') ||
    h.includes('whatsapp') || h.includes('mobile') || h.includes('fone')
  )

  const contatos: Contato[] = []
  for (let i = 1; i < linhas.length; i++) {
    const cols = splitLinha(linhas[i])

    let nome = ''
    if (idxNome >= 0) {
      nome = cols[idxNome] || ''
    } else if (idxPrimeiro >= 0) {
      nome = [cols[idxPrimeiro], idxUltimo >= 0 ? cols[idxUltimo] : ''].filter(Boolean).join(' ')
    } else {
      nome = cols[0] || ''
    }

    const telefone = idxTel >= 0 ? limpaTelefone(cols[idxTel] || '') : ''

    if (nome.trim()) contatos.push({ nome: nome.trim(), telefone })
  }
  return contatos
}

export default function ImportarContatos() {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [arquivo, setArquivo] = useState('')
  const [resultado, setResultado] = useState<{ criados: number; duplicados: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: (dados: Contato[]) => api.post('/clientes/importar', { contatos: dados }).then(r => r.data),
    onSuccess: (data) => setResultado(data),
  })

  const handleArquivo = (file: File) => {
    setArquivo(file.name)
    setResultado(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const texto = e.target?.result as string
      const lista = file.name.toLowerCase().endsWith('.csv') ? parseCSV(texto) : parseVCF(texto)
      setContatos(lista)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleArquivo(file)
  }

  const remover = (idx: number) => setContatos(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 border border-primary/30 p-2.5 rounded-lg">
          <Users size={22} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">IMPORTAR CONTATOS</h2>
          <p className="text-sm text-gray-400 uppercase tracking-wide">Importe contatos do WhatsApp para o banco de dados</p>
        </div>
      </div>

      {/* Instrucoes */}
      <div className="card text-sm text-gray-300 space-y-1">
        <p className="font-bold text-white uppercase tracking-wide mb-2">Como exportar seus contatos:</p>
        <p><span className="text-primary font-bold">Android:</span> Contatos → Menu (⋮) → Gerenciar contatos → Exportar → Salvar como .vcf</p>
        <p><span className="text-primary font-bold">iPhone:</span> Use o app "Contatos" → Compartilhar contato → ou exporte via iCloud em icloud.com/contacts</p>
        <p className="text-gray-500 text-xs mt-2">Depois selecione o arquivo .vcf aqui abaixo.</p>
      </div>

      {/* Upload */}
      {!resultado && (
        <div
          className="card border-2 border-dashed border-brand-dark-border hover:border-primary/50 transition-colors cursor-pointer text-center py-10"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-white font-bold uppercase tracking-wide">
            {arquivo ? arquivo : 'Clique ou arraste o arquivo .vcf aqui'}
          </p>
          <p className="text-gray-500 text-sm mt-1">Formatos aceitos: .vcf ou .csv</p>
          <input
            ref={inputRef}
            type="file"
            accept=".vcf,.vcard,.csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleArquivo(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview */}
      {contatos.length > 0 && !resultado && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold uppercase tracking-wide">
              {contatos.length} CONTATOS ENCONTRADOS
            </h3>
            <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2 rounded-lg uppercase text-sm transition-colors"
              onClick={() => mutation.mutate(contatos)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Importando...' : `Importar ${contatos.length} contatos`}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-brand-dark-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-brand-dark-card border-b border-brand-dark-border">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-400 uppercase text-xs font-bold">#</th>
                  <th className="text-left px-3 py-2 text-gray-400 uppercase text-xs font-bold">Nome</th>
                  <th className="text-left px-3 py-2 text-gray-400 uppercase text-xs font-bold">Telefone</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {contatos.map((c, i) => (
                  <tr key={i} className="border-b border-brand-dark-border last:border-0 hover:bg-white/3">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 text-white font-medium">{c.nome}</td>
                    <td className="px-3 py-2 text-gray-300">{c.telefone || '—'}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => remover(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="card text-center space-y-4 py-8">
          <div className="flex justify-center">
            <CheckCircle size={56} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-white uppercase">Importação Concluída!</h3>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{resultado.criados}</p>
              <p className="text-gray-400 uppercase font-bold">Cadastrados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-yellow-400">{resultado.duplicados}</p>
              <p className="text-gray-400 uppercase font-bold">Já Existiam</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-gray-300">{resultado.total}</p>
              <p className="text-gray-400 uppercase font-bold">Total</p>
            </div>
          </div>
          {resultado.duplicados > 0 && (
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
              <AlertCircle size={16} />
              <span>Os duplicados não foram cadastrados novamente.</span>
            </div>
          )}
          <button
            className="btn-secondary mt-2 uppercase font-bold"
            onClick={() => { setResultado(null); setContatos([]); setArquivo('') }}
          >
            Importar outro arquivo
          </button>
        </div>
      )}
    </div>
  )
}
