
export interface MeridianCatalog {
  id: string;
  name: string;
  chapter: number;
  names: string[];
}

export const MERIDIAN_CATALOG: MeridianCatalog[] = [
  {
    id:'LU', name:'手太阴肺经', chapter:1,
    names:'中府 云门 天府 侠白 尺泽 孔最 列缺 经渠 太渊 鱼际 少商'.split(' ')
  },
  {
    id:'LI', name:'手阳明大肠经', chapter:2,
    names:'商阳 二间 三间 合谷 阳溪 偏历 温溜 下廉 上廉 手三里 曲池 肘髎 手五里 臂臑 肩髃 巨骨 天鼎 扶突 口禾髎 迎香'.split(' ')
  },
  {
    id:'ST', name:'足阳明胃经', chapter:3,
    names:'承泣 四白 巨髎 地仓 大迎 颊车 下关 头维 人迎 水突 气舍 缺盆 气户 库房 屋翳 膺窗 乳中 乳根 不容 承满 梁门 关门 太乙 滑肉门 天枢 外陵 大巨 水道 归来 气冲 髀关 伏兔 阴市 梁丘 犊鼻 足三里 上巨虚 条口 下巨虚 丰隆 解溪 冲阳 陷谷 内庭 厉兑'.split(' ')
  },
  {
    id:'SP', name:'足太阴脾经', chapter:4,
    names:'隐白 大都 太白 公孙 商丘 三阴交 漏谷 地机 阴陵泉 血海 箕门 冲门 府舍 腹结 大横 腹哀 食窦 天溪 胸乡 周荣 大包'.split(' ')
  },
  {
    id:'HT', name:'手少阴心经', chapter:5,
    names:'极泉 青灵 少海 灵道 通里 阴郄 神门 少府 少冲'.split(' ')
  },
  {
    id:'SI', name:'手太阳小肠经', chapter:6,
    names:'少泽 前谷 后溪 腕骨 阳谷 养老 支正 小海 肩贞 臑俞 天宗 秉风 曲垣 肩外俞 肩中俞 天窗 天容 颧髎 听宫'.split(' ')
  },
  {
    id:'BL', name:'足太阳膀胱经', chapter:7,
    names:'睛明 攒竹 眉冲 曲差 五处 承光 通天 络却 玉枕 天柱 大杼 风门 肺俞 厥阴俞 心俞 督俞 膈俞 肝俞 胆俞 脾俞 胃俞 三焦俞 肾俞 气海俞 大肠俞 关元俞 小肠俞 膀胱俞 中膂俞 白环俞 上髎 次髎 中髎 下髎 会阳 承扶 殷门 浮郄 委阳 委中 附分 魄户 膏肓 神堂 譩譆 膈关 魂门 阳纲 意舍 胃仓 肓门 志室 胞肓 秩边 合阳 承筋 承山 飞扬 跗阳 昆仑 仆参 申脉 金门 京骨 束骨 足通谷 至阴'.split(' ')
  },
  {
    id:'KI', name:'足少阴肾经', chapter:8,
    names:'涌泉 然谷 太溪 大钟 水泉 照海 复溜 交信 筑宾 阴谷 横骨 大赫 气穴 四满 中注 肓俞 商曲 石关 阴都 腹通谷 幽门 步廊 神封 灵墟 神藏 彧中 俞府'.split(' ')
  },
  {
    id:'PC', name:'手厥阴心包经', chapter:9,
    names:'天池 天泉 曲泽 郄门 间使 内关 大陵 劳宫 中冲'.split(' ')
  },
  {
    id:'TE', name:'手少阳三焦经', chapter:10,
    names:'关冲 液门 中渚 阳池 外关 支沟 会宗 三阳络 四渎 天井 清泠渊 消泺 臑会 肩髎 天髎 天牖 翳风 瘈脉 颅息 角孙 耳门 耳和髎 丝竹空'.split(' ')
  },
  {
    id:'GB', name:'足少阳胆经', chapter:11,
    names:'瞳子髎 听会 上关 颔厌 悬颅 悬厘 曲鬓 率谷 天冲 浮白 头窍阴 完骨 本神 阳白 头临泣 目窗 正营 承灵 脑空 风池 肩井 渊腋 辄筋 日月 京门 带脉 五枢 维道 居髎 环跳 风市 中渎 膝阳关 阳陵泉 阳交 外丘 光明 阳辅 悬钟 丘墟 足临泣 地五会 侠溪 足窍阴'.split(' ')
  },
  {
    id:'LR', name:'足厥阴肝经', chapter:12,
    names:'大敦 行间 太冲 中封 蠡沟 中都 膝关 曲泉 阴包 足五里 阴廉 急脉 章门 期门'.split(' ')
  },
  {
    id:'GV', name:'督脉', chapter:13,
    names:'长强 腰俞 腰阳关 命门 悬枢 脊中 中枢 筋缩 至阳 灵台 神道 身柱 陶道 大椎 哑门 风府 脑户 强间 后顶 百会 前顶 囟会 上星 神庭 印堂 素髎 水沟 兑端 龈交'.split(' ')
  },
  {
    id:'CV', name:'任脉', chapter:14,
    names:'会阴 曲骨 中极 关元 石门 气海 阴交 神阙 水分 下脘 建里 中脘 上脘 巨阙 鸠尾 中庭 膻中 玉堂 紫宫 华盖 璇玑 天突 廉泉 承浆'.split(' ')
  }
];

const EXPECTED: Record<string, number> = {
  LU:11, LI:20, ST:45, SP:21, HT:9, SI:19, BL:67,
  KI:27, PC:9, TE:23, GB:44, LR:14, GV:29, CV:24
};

for (const meridian of MERIDIAN_CATALOG) {
  if (meridian.names.length !== EXPECTED[meridian.id]) {
    throw new Error(meridian.name + '目录数量不正确。');
  }
}

export const ACUPOINT_CATALOG = MERIDIAN_CATALOG.flatMap(meridian =>
  meridian.names.map((name, index) => {
    const ordinal = index + 1;

    // 印堂插在第25个条目，但代码是GV24+。
    // 后续素髎、水沟等保留原国际代码。
    const code = meridian.id === 'GV'
      ? ordinal === 25
        ? 'GV24+'
        : 'GV' + (ordinal > 25 ? ordinal - 1 : ordinal)
      : meridian.id + ordinal;

    return {
      code,
      name,
      meridian: meridian.id,
      clause: '5.' + meridian.chapter + '.' + ordinal
    };
  })
);

if (
  ACUPOINT_CATALOG.length !== 362 ||
  new Set(ACUPOINT_CATALOG.map(point => point.code)).size !== 362
) {
  throw new Error('经穴目录总数或代码唯一性检查失败。');
}
