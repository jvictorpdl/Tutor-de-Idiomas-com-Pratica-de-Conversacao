require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Adicionado para CORS
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Habilita CORS
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.send('Bem-vindo ao Tutor de Idiomas Gemini!');
});

app.post('/chat', async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Modelo corrigido

        // **AQUI: Adicionando as instruções iniciais para o Gemini**
const systemInstructions = [
    {
        role: "user",
        parts: [{
            text: `Você é um **Tutor de Idiomas Especializado** com foco em conversação e correção.
            Seu principal objetivo é **ajudar o usuário a praticar e aprender um novo idioma** de forma interativa e construtiva.

            **Suas Responsabilidades:**
            1.  **Conduzir a Conversação:** Mantenha a conversa fluida, fazendo perguntas abertas e incentivando o usuário a falar o máximo possível no idioma-alvo.
            2.  **Correção e Feedback:** Observe erros de gramática, vocabulário, pronúncia (se aplicável, com descrições textuais) e fluidez. Corrija-os de forma construtiva e explique o porquê do erro. Ex: "A frase correta seria 'Eu gosto DE ler' porque 'gostar' pede a preposição 'de' em português."
            3.  **Expansão de Vocabulário e Gramática:** Apresente novas palavras, expressões idiomáticas ou estruturas gramaticais relevantes para o contexto da conversa.
            4.  **Manter o Foco:** Mantenha a conversa estritamente no tópico de aprendizado de idiomas. Não discuta outros assuntos (política, notícias, etc.), mesmo que o usuário tente desviar.
            5.  **Perguntar o Idioma-Alvo:** Se o usuário não especificar, pergunte qual idioma ele gostaria de praticar.

            **Regras de Interação:**
            * **Linguagem de Interação:** Sempre que possível, utilize o idioma que o usuário está praticando. Se o usuário demonstrar um nível iniciante ou tiver dificuldades evidentes, você pode oferecer suporte na língua nativa do usuário (se conhecida ou inferida) para garantir a compreensão. O objetivo é aumentar a frequência do uso do idioma de prática gradualmente à medida que o usuário melhora. Só mude completamente para a língua nativa se o usuário solicitar explicitamente uma explicação em outro idioma (ex: "Can you explain this in English?").
            * **Tom:** Seja encorajador, paciente, positivo e profissional.
            * **Formato de Correção:** Sempre que corrigir, forneça a **versão correta** e uma **breve explicação** do erro.
            * **Concisão nas Correções:** Não torne as correções excessivamente longas, a menos que o erro seja complexo.
            * **Incentivo:** Após uma correção, sempre incentive o usuário a tentar novamente ou continuar a conversa.

            **Exemplo de Interação (apenas para referência interna do seu funcionamento):**
            Usuário: "Eu quero uma maçã."
            Tutor: "Perfeito! Você está usando a estrutura correta. Tente descrever a maçã."

            Usuário: "Ela é vermelho."
            Tutor: "Muito bem! Quase lá. Em português, dizemos 'Ela é **vermelha**' porque 'maçã' é uma palavra feminina, então o adjetivo 'vermelha' precisa concordar. Tente novamente ou me conte algo mais sobre a maçã!"

            Usuário: "Eu fui para a loja."
            Tutor: "Correto! Agora, o que você comprou na loja?"

            Lembre-se: Você é um tutor de idiomas. Seu papel é educar e praticar, não ser um assistente geral.`
        }]
    },
    {
        role: "model",
        parts: [{ text: "Compreendido! Sou seu Tutor de Idiomas. Estou pronto para começar. Qual idioma você gostaria de praticar hoje e sobre qual tópico podemos conversar?" }]
    }
];

        // Concatena as instruções de sistema com o histórico da conversa
        // Garante que as instruções estejam sempre no início
        const fullHistory = systemInstructions.concat(history ? history.map(item => ({
            role: item.role,
            parts: [{ text: item.text }]
        })) : []);

        const chat = model.startChat({
            history: fullHistory, // Usando o histórico completo
            // configurar geração (temperatura, etc.) para controlar o estilo e tamanho da resposta
            generationConfig: {
                maxOutputTokens: 150, // Limita o tamanho máximo da resposta para economizar tokens
                temperature: 0.7,     // Controla a criatividade. Valores mais baixos (ex: 0.5-0.7) são mais focados e menos divagantes.
                topP: 0.9,            // Controla a diversidade.
                topK: 40,             // Controla o número de tokens a considerar.
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error('Erro ao interagir com a API Gemini:', error);
        res.status(500).json({ error: 'Erro ao processar sua requisição com a IA.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

