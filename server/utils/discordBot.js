// utils/discordBot.js
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, Partials } = require('discord.js');
const Project = require('../models/Project');

// 建立Discord客戶端
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message] // 確保可以接收到所有訊息
});

// 儲存Discord伺服器ID(需要在環境變數設定)
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const DISCORD_CATEGORY_ID = process.env.DISCORD_CATEGORY_ID || '1351208992680050739';

// 初始化Discord機器人
const initBot = async () => {
  try {
    // 設置事件監聽器
    client.on('ready', () => {
      console.log(`Discord bot logged in as ${client.user.tag}!`);
      // 輸出機器人所在的所有伺服器
      console.log('Discord bot is in these servers:');
      client.guilds.cache.forEach(guild => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
      });
    });
    
    // 監聽訊息事件
    client.on('messageCreate', handleDiscordMessage);
    
    // 監聽錯誤事件
    client.on('error', error => {
      console.error('Discord client error:', error);
    });
    
    // 登入機器人
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('Discord bot initialization failed:', error);
  }
};

// 處理Discord訊息
const handleDiscordMessage = async (message) => {
  try {
    // 忽略機器人訊息防止無限循環
    if (message.author.bot) return;
    
    // 尋找對應的專案
    const project = await Project.findOne({ discordChannelId: message.channelId });
    if (!project) return;
    
    // 處理訊息附件（如有圖片、文件等）
    const attachments = [];
    if (message.attachments && message.attachments.size > 0) {
      message.attachments.forEach(attachment => {
        attachments.push({
          filename: attachment.name || `attachment-${Date.now()}`,
          originalname: attachment.name || `attachment-${Date.now()}`,
          url: attachment.url,
          mimetype: attachment.contentType || 'application/octet-stream',
          size: attachment.size,
          isDiscordAttachment: true
        });
      });
      console.log(`處理了 ${attachments.length} 個Discord訊息附件`);
    }
    
    // 建立新訊息物件
    const newMessage = {
      message: message.content,
      sender: message.author.username,
      projectId: project._id,
      attachments: attachments,
      createdAt: new Date()
    };
    
    // 將Discord訊息保存到專案
    project.messages.push(newMessage);
    await project.save();
    
    // 取得最新訊息的ID (剛添加到陣列中的最後一個訊息)
    const messageId = project.messages[project.messages.length - 1]._id;
    
    // 準備要透過Socket.IO發送的訊息物件
    const messageToEmit = {
      _id: messageId,
      message: message.content,
      sender: message.author.username,
      attachments: attachments,
      createdAt: newMessage.createdAt,
      projectId: project._id,
      isNew: true, // 標記為新訊息
      fromDiscord: true // 標記為來自Discord的訊息
    };
    
    // 嘗試透過Socket.IO發送新訊息通知
    try {
      // 使用全局的io實例
      if (global.io) {
        console.log(`透過Socket.IO發送來自Discord的新訊息通知到房間: ${project._id}`);
        global.io.to(project._id.toString()).emit('new_message', messageToEmit);
      } else {
        console.log('全局Socket.IO實例未初始化，無法發送實時通知');
      }
    } catch (socketError) {
      console.error('Socket.IO發送通知時發生錯誤:', socketError);
    }
    
    console.log(`Message from Discord saved to project: ${project.projectName}`);
  } catch (error) {
    console.error('Error handling Discord message:', error);
  }
};

// 為專案創建Discord頻道
const createChannelForProject = async (project) => {
  try {
    console.log('嘗試為專案創建Discord頻道:', project.projectName);
    
    // 確保機器人已連接
    if (!client.isReady()) {
      console.error('Discord bot is not ready');
      return null;
    }
    
    // 手動輸出伺服器ID和緩存中的伺服器列表
    console.log('設定的Discord伺服器ID:', DISCORD_SERVER_ID);
    console.log('機器人緩存中的伺服器:');
    client.guilds.cache.forEach(g => {
      console.log(`- ${g.name} (ID: ${g.id})`);
    });
    
    // 獲取Discord伺服器
    const guild = client.guilds.cache.get(DISCORD_SERVER_ID);
    if (!guild) {
      console.error('Discord server not found with ID:', DISCORD_SERVER_ID);
      return null;
    }
    
    console.log('找到Discord伺服器:', guild.name);
    
    // 使用專案名稱創建新頻道
    const channelName = project.projectName.toLowerCase().replace(/\s+/g, '-');
    console.log('嘗試創建頻道:', channelName);
    
    // 檢查是否已存在同名頻道
    const existingChannel = guild.channels.cache.find(
      channel => channel.name === channelName && channel.type === ChannelType.GuildText
    );
    
    if (existingChannel) {
      console.log('找到現有頻道，將使用此頻道:', existingChannel.name, existingChannel.id);
      return existingChannel.id;
    }
    
    // 找到指定的類別
    console.log('尋找指定類別ID:', DISCORD_CATEGORY_ID);
    const category = guild.channels.cache.get(DISCORD_CATEGORY_ID);
    
    if (!category) {
      console.warn('找不到指定類別，將在伺服器根目錄創建頻道');
    } else {
      console.log('找到類別:', category.name);
    }
    
    // 創建新頻道
    console.log('開始創建新頻道...');
    try {
      const channelOptions = {
        name: channelName,
        type: ChannelType.GuildText,
        reason: `專案 ${project.projectName} 的聊天頻道`
      };
      
      // 如果類別存在，將頻道加入到該類別中
      if (category) {
        channelOptions.parent = category.id;
      }
      
      const channel = await guild.channels.create(channelOptions);
      
      console.log('成功創建頻道:', channel.name, channel.id);
      
      // 發送歡迎訊息
      await channel.send(`歡迎來到 ${project.projectName} 專案頻道！`);
      console.log('已發送歡迎訊息');
      
      return channel.id;
    } catch (createError) {
      console.error('創建頻道時發生錯誤:', createError);
      
      // 嘗試使用舊版API (Discord.js v13兼容模式)
      try {
        console.log('嘗試使用替代方法創建頻道');
        
        const oldOptions = {
          type: 'GUILD_TEXT',
          reason: `專案 ${project.projectName} 的聊天頻道`
        };
        
        if (category) {
          oldOptions.parent = category.id;
        }
        
        const oldApiChannel = await guild.channels.create(channelName, oldOptions);
        
        console.log('使用舊版API創建頻道成功:', oldApiChannel.name);
        
        // 發送歡迎訊息
        await oldApiChannel.send(`歡迎來到 ${project.projectName} 專案頻道！`);
        
        return oldApiChannel.id;
      } catch (oldApiError) {
        console.error('使用舊版API創建頻道也失敗:', oldApiError);
        throw new Error('所有方法創建頻道均失敗');
      }
    }
    
    // 註意：這部分代碼實際上永遠不會執行，因為我們已經在創建頻道的地方返回了結果
  } catch (error) {
    console.error('Error creating Discord channel:', error);
    return null;
  }
};

// 傳送訊息到Discord頻道
const sendMessageToDiscord = async (channelId, username, message, attachments = []) => {
  try {
    console.log(`嘗試傳送訊息到Discord頻道 ${channelId}，發送者: ${username}`);
    
    // 確保機器人已連接
    if (!client.isReady()) {
      console.error('Discord bot is not ready');
      return false;
    }
    
    // 獲取頻道
    const channel = client.channels.cache.get(channelId);
    let targetChannel;
    
    if (!channel) {
      console.error('Discord channel not found in cache:', channelId);
      
      // 嘗試強制獲取頻道
      try {
        const fetchedChannel = await client.channels.fetch(channelId);
        if (fetchedChannel) {
          console.log('通過fetch獲取到頻道:', fetchedChannel.name);
          targetChannel = fetchedChannel;
        } else {
          console.error('無法獲取頻道');
          return false;
        }
      } catch (fetchError) {
        console.error('Fetch頻道失敗:', fetchError);
        return false;
      }
    } else {
      targetChannel = channel;
    }
    
    // 處理訊息選項
    const messageOptions = {
      content: `**${username}**: ${message}`
    };
    
    // 如果有附件，處理附件
    if (attachments && attachments.length > 0) {
      const files = [];
      
      for (const attachment of attachments) {
        // 檢查是本地檔案還是URL
        if (attachment.path) {
          // 本地檔案
          files.push({
            attachment: attachment.path,
            name: attachment.originalname || attachment.filename
          });
        } else if (attachment.url) {
          // 遠端URL
          files.push({
            attachment: attachment.url,
            name: attachment.originalname || attachment.filename
          });
        }
      }
      
      if (files.length > 0) {
        messageOptions.files = files;
      }
    }
    
    // 發送訊息
    console.log(`發送訊息到頻道 ${targetChannel.name}`, messageOptions);
    await targetChannel.send(messageOptions);
    console.log('訊息已發送');
    return true;
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    return false;
  }
};

module.exports = {
  initBot,
  createChannelForProject,
  sendMessageToDiscord
};
