export const RACHA_INFO_MD = `**¿Como funciona la racha?**

- Escribe al menos **<span style="color: var(--text-2);">un mensaje</span>** por directo para mantenerla.
- Si faltas a un directo, la racha se reinicia.
- La racha estara activa solo si tienes mas de 5 dias seguidos.

**¿Como congelar racha?**
- Si tienes al menos **<span style="color: var(--text-2);">24 tickets</span>** y tu racha **<span style="color: var(--text-2);">esta activa</span>**, se consumiran los tickets y se congelara al faltar a un directo automaticamente.
- Si sigues faltando, la racha se mantendra tantas veces como tickets tengas.
- Al siguiente directo que escribas, la racha se mantendra y aumentara.
- Sin tickets, la racha se reinicia.

**¿Que significan los colores?**
- **<span style="color: var(--text-2);">Normal:</span>** la racha esta mantenida
- **<span style="color: rgba(128, 41, 26, 1);">Rojo:</span>** falta mensaje en el directo actual
- **<span style="color: rgba(26, 104, 128, 1);">Azul:</span>** racha congelada, podras ampliarla`;

export const MENSAJES_CHAT_MD = `**Comandos del Chat**

- **<span style="color: var(--text-2);">spoiler</span>**
  - Le ocultara el historial de mensajes a Sara para asi evitar que lea el spoiler.
- **<span style="color: var(--text-2);">!clip</span>**
  - Clip automatico de los ultimos 30 segundos.
  - Se resubira al Discord.
- **<span style="color: var(--text-2);">!sr [cancion]</span>** → *!sr Ado - 罪と罰*
  - Si Sara lo activa, puedes añadir canciones a la lista de reproduccion.
- **<span style="color: var(--text-2);">!cum [dd/mm]</span>** → *!cum 03/08*
  - Cuando llegue el dia se te felicitara en el Discord.
  - Si hay directo ese dia, tambien se te felicitara por el chat.`;

export const MENSAJES_MOD_MD = `**Moderadores Clandestinos**

- Si puedes ver esto, Sara te ha asignado como moderador clandestino.
- Puedes expulsar usuarios temporal o permanentemente si incumplen las normas.
- No estas obligado a actuar.

**Comandos del Chat**

- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bs [usuario]</span>** → *Ban temporal (10m)*
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bn [usuario]</span>** → *Ban permanente*
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">ub [usuario]</span>** → *Quitar ban*

**Guia Rapida**
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bs</span>** *(backsit)*
  - *Destripe de la historia de un juego*
  - *Ayuda no solicitada*
- **<span style="color: var(--text-2); font-family: 'JetBrains Mono', monospace;">bn</span>** *(ban)*
  - *Insultos y faltas de respeto*
  - *Incitacion al odio de cualquier tipo*
  - *Reiteracion de malos comportamientos*

*Los conflictos entre usuarios los gestiona Sara.*`;

export const MENSAJES_NO_MOD_MD = `**Moderadores Clandestinos**

*El acceso completo a esta informacion esta reservado a moderadores clandestinos*

*Si eres uno inicia sesion con tu cuenta de Twitch*`;

export const TICKETS_INFO_MD = `**¿Para que sirven los tickets?**
- Usar el Gacha consume **<span style="color: var(--text-2);">3 tickets</span>**.
- Congelar tu racha consume **<span style="color: var(--text-2);">24 tickets</span>**.

**¿Como conseguir tickets?**
- Ganando los minijuegos de la [GameBoy](/gameboy).
- Eventos que organice la Sara.`;

export const EMOTES_INFO_MD = `**¿No puedes ver los emotes?**
- Añade la extension de [7TV](https://7tv.app/).

**¿Que necesitas para añadir emotes?**
- <span style="font-weight: 500;">500 mensajes</span> y <span style="font-weight: 500;">3 meses</span> de follow
    - *5 huecos.*
- <span style="font-weight: 500;">10000 mensajes</span> y <span style="font-weight: 500;">1 año</span> de follow
    - *10 huecos.*

**Comandos de chat disponibles**
- **<span style="color: var(--text-2);">!asignar <url_emote7TV></span>**
    - *El emote que añadas tendra tu nombre (no consume hueco)*
- **<span style="color: var(--text-2);">!añadir <url_emote7TV></span>**
    - *Añade un emote.*
- **<span style="color: var(--text-2);">!añadir [nombre] <url_emote7TV></span>**
    - *Añade un emote con un nombre.*
- **<span style="color: var(--text-2);">!editar [nombre] [nuevo_nombre]</span>**
    - *Cambia el nombre de un emote.*
- **<span style="color: var(--text-2);">!eliminar [nombre]</span>**
    - *Elimina un emote.*`;
