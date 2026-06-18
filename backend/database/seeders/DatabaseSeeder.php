<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Cliente;
use App\Models\CategoriaProduto;
use App\Models\Produto;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Usuários do sistema
        $users = [
            ['name' => 'Administrador',  'email' => 'admin@rlgrafica.com.br',    'password' => Hash::make('admin123'),   'role' => 'admin'],
            ['name' => 'Vendedor Demo',  'email' => 'vendedor@rlgrafica.com.br', 'password' => Hash::make('vendas123'), 'role' => 'vendedor'],
            ['name' => 'Designer Demo',  'email' => 'designer@rlgrafica.com.br', 'password' => Hash::make('arte123'),   'role' => 'designer'],
            ['name' => 'Produção Demo',  'email' => 'producao@rlgrafica.com.br', 'password' => Hash::make('prod123'),   'role' => 'producao'],
        ];
        foreach ($users as $u) {
            User::firstOrCreate(['email' => $u['email']], $u);
        }

        // Categorias de produto
        $categorias = [
            ['nome' => 'Vestuário',          'descricao' => 'Camisetas, bonés e acessórios de vestuário'],
            ['nome' => 'Brindes',            'descricao' => 'Canecas, squeeze, porta-canetas'],
            ['nome' => 'Impressão Digital',  'descricao' => 'Banners, lonas, adesivos, fachadas'],
            ['nome' => 'Gráfica Offset',     'descricao' => 'Cartões, panfletos, folders, talões'],
            ['nome' => 'Sinalização',        'descricao' => 'Placas, letreiros, totens'],
        ];
        foreach ($categorias as $c) {
            CategoriaProduto::updateOrCreate(['nome' => $c['nome']], $c);
        }

        $catIds = CategoriaProduto::pluck('id', 'nome');

        // Produtos padrão da gráfica
        $produtos = [
            ['nome' => 'Camiseta Personalizada',    'categoria_id' => $catIds['Vestuário'],         'preco_base' => 35.00,  'unidade_medida' => 'un',  'tempo_producao_dias' => 3],
            ['nome' => 'Caneca Personalizada',      'categoria_id' => $catIds['Brindes'],           'preco_base' => 25.00,  'unidade_medida' => 'un',  'tempo_producao_dias' => 2],
            ['nome' => 'Banner Lona 440g',          'categoria_id' => $catIds['Impressão Digital'], 'preco_base' => 18.00,  'unidade_medida' => 'm²',  'tempo_producao_dias' => 1],
            ['nome' => 'Adesivo Recortado',         'categoria_id' => $catIds['Impressão Digital'], 'preco_base' => 12.00,  'unidade_medida' => 'm²',  'tempo_producao_dias' => 1],
            ['nome' => 'Cartão de Visita 4x4',      'categoria_id' => $catIds['Gráfica Offset'],    'preco_base' => 55.00,  'unidade_medida' => 'cx',  'tempo_producao_dias' => 3],
            ['nome' => 'Panfleto A5 4x4',           'categoria_id' => $catIds['Gráfica Offset'],    'preco_base' => 120.00, 'unidade_medida' => 'ml',  'tempo_producao_dias' => 3],
            ['nome' => 'Folder A4 4x4',             'categoria_id' => $catIds['Gráfica Offset'],    'preco_base' => 180.00, 'unidade_medida' => 'ml',  'tempo_producao_dias' => 4],
            ['nome' => 'Talão de Pedido 2 vias',    'categoria_id' => $catIds['Gráfica Offset'],    'preco_base' => 90.00,  'unidade_medida' => 'bl',  'tempo_producao_dias' => 5],
            ['nome' => 'Placa PVC 3mm',             'categoria_id' => $catIds['Sinalização'],       'preco_base' => 45.00,  'unidade_medida' => 'm²',  'tempo_producao_dias' => 2],
            ['nome' => 'Adesivo Vinil Transparente','categoria_id' => $catIds['Impressão Digital'], 'preco_base' => 15.00,  'unidade_medida' => 'm²',  'tempo_producao_dias' => 1],
        ];
        foreach ($produtos as $p) {
            Produto::updateOrCreate(['nome' => $p['nome']], $p);
        }

        // Clientes de exemplo
        $clientes = [
            [
                'nome' => 'João Silva',
                'tipo_pessoa' => 'F',
                'cpf_cnpj' => '123.456.789-00',
                'telefone' => '(11) 91234-5678',
                'whatsapp' => '(11) 91234-5678',
                'email' => 'joao@email.com',
                'cidade' => 'São Paulo',
                'estado' => 'SP',
                'created_by' => 1,
            ],
            [
                'nome' => 'Empresa ABC Ltda',
                'tipo_pessoa' => 'J',
                'cpf_cnpj' => '12.345.678/0001-90',
                'telefone' => '(11) 3456-7890',
                'whatsapp' => '(11) 99876-5432',
                'email' => 'contato@empresaabc.com.br',
                'cidade' => 'São Paulo',
                'estado' => 'SP',
                'created_by' => 1,
            ],
        ];
        foreach ($clientes as $c) {
            Cliente::updateOrCreate(['cpf_cnpj' => $c['cpf_cnpj']], $c);
        }

        $this->command->info('Seed concluído com sucesso!');
        $this->command->table(
            ['Papel', 'E-mail', 'Senha'],
            [
                ['admin',    'admin@rlgrafica.com.br',    'admin123'],
                ['vendedor', 'vendedor@rlgrafica.com.br', 'vendas123'],
                ['designer', 'designer@rlgrafica.com.br', 'arte123'],
                ['producao', 'producao@rlgrafica.com.br', 'prod123'],
            ]
        );
    }
}
