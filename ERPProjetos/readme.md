
# ERPApp - Sistema ERP Mobile em JavaScript (React Native + Expo)

Sistema ERP focado em dispositivos móveis, desenvolvido com **React Native** e **Expo**, utilizando **Supabase** como backend. O app oferece funcionalidades completas para gestão de produtos, controle de vendas, estoque e financeiro, com autenticação biométrica e interface moderna.

---

## 🚀 Tecnologias Utilizadas

- **React Native** – Framework para desenvolvimento mobile multiplataforma  
- **Expo** – Plataforma para desenvolvimento React Native simplificado  
- **JavaScript** – Linguagem principal  
- **React Navigation** & **Expo Router** – Navegação e roteamento  
- **Supabase** – Backend como serviço (BaaS) com PostgreSQL  
- **Expo Local Authentication** – Autenticação biométrica (Digital / Face ID)  
- **Expo Secure Store** – Armazenamento seguro de credenciais  

---

## 📱 Funcionalidades Principais

- Interface moderna, responsiva e com suporte a temas claro e escuro  
- Componentes reutilizáveis e animações suaves  
- **Autenticação biométrica** (Digital para Android, Face ID para iOS)  
- Login e cadastro de usuários com armazenamento seguro  
- Dashboard com módulos principais do sistema  
- **Gestão completa de produtos:**  
  - Listagem, busca, filtros e refresh pull-to-refresh  
  - CRUD (criar, editar, excluir) com validação e formatação de preços em Real (R$)  
- Interface limpa sem notificações do sistema (StatusBar oculta)  

---

## 🔐 Autenticação Biométrica

- Login com impressão digital (Android) ou Face ID (iOS)  
- Ativação via configurações, com validação por senha  
- Credenciais armazenadas localmente usando Secure Store para máxima segurança  
- Logout automático após configuração para garantir segurança  

---

## 📦 Gestão de Produtos

- Listagem moderna com cards e filtros  
- Adição, edição e exclusão com confirmação  
- Campos obrigatórios validados  
- Formatação monetária e experiência intuitiva  

---

## 🛠️ Como Executar

1. Clone o repositório  
2. Instale as dependências:  
   ```bash
   npm install
   ```  
3. Inicie o servidor de desenvolvimento:  
   ```bash
   npm start
   ```  
4. Execute nas plataformas desejadas:  
   - Android: `npm run android`  
   - iOS: `npm run ios`  
   - Web: `npm run web`  

---

## 📁 Estrutura do Projeto

```
├── app/                    # Páginas da aplicação (Expo Router)
│   ├── (tabs)/             # Navegação por abas
│   │   ├── index.js        # Dashboard
│   │   ├── products.js     # Gestão de produtos
│   │   └── settings.js     # Configurações (inclui biometria)
│   ├── _layout.js          # Layout principal
│   ├── login.js            # Tela de login
│   ├── signup.js           # Tela de cadastro
│   └── +not-found.js       # Página 404
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Componentes de interface
│   └── *.js                # Outros componentes
├── hooks/                  # Hooks customizados
│   └── useAuth.js          # Hook de autenticação (inclui biométrica)
├── constants/              # Constantes da aplicação
├── database/               # Consultas SQL e estrutura do banco
│   └── queries.sql         # Consultas para tabela produtos
├── assets/                 # Recursos estáticos
└── scripts/                # Scripts utilitários
```

---

## 🎨 Interface e Design

- Design moderno com cards, sombras e bordas arredondadas  
- Paleta de cores consistente com suporte a temas claro/escuro  
- Feedback visual com indicadores de carregamento e estados de ação  
- Acessibilidade para diferentes tamanhos de tela  
- Navegação intuitiva por abas  

---

## 🔒 Segurança

- Credenciais biométricas armazenadas localmente com **Secure Store**  
- Validação de senha antes de habilitar biometria  
- Logout automático após alteração de configurações  
- Validação rigorosa de dados no frontend e backend  

---

## Contato

Para dúvidas, sugestões ou contribuições, abra uma issue ou envie um pull request.

---

Obrigado por usar o ERPApp! 🚀
