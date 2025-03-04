import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup, Telegraf } from "telegraf";
import { Bot } from "./models/bot.model";
import { Profession } from "./models/professions.model";
import { Master } from "./models/master.model";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "src/app.constants";
import { Rating } from "./models/rating.model";
import { Customer } from "./models/customer.model";
import { SelectedServices } from "./models/selected_services.model";
import { Op } from "sequelize";
import { BIGINT } from "sequelize";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Rating) private readonly ratingModel: typeof Rating,
    @InjectModel(Profession)
    private readonly professionModel: typeof Profession,
    @InjectModel(Master) private readonly masterModel: typeof Master,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(SelectedServices)
    private readonly selectedServicesModel: typeof SelectedServices,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async onStart(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await this.botModel.create({
          user_id,
          user_name: ctx.from?.username,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          lang: ctx.from?.language_code,
          status: true,
        });
      } else if (user && !user.status) {
        user.status = true;
        await user.save();
      }

      await ctx.reply(`Iltimos Ro'yxatdan o'tish tugmasini bosing:`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["Ro'yxatdan o'tish 👨‍💻"]])
          .resize()
          .oneTime(),
      });
    } catch (error) {
      console.log("onStart error: ", error);
    }
  }

  async onStop(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (user && user.status) {
        user.status = false;
        await user.save();

        await ctx.reply("Sizni yana kutib qolamiz😕", {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log("onStop error: ", error);
    }
  }

  async onRegistration(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        await ctx.reply(`Ro'yxatdan o'tish turini tanlang: 👇`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["Usta 👨‍🔧", "Mijoz 👤"]])
            .resize()
            .oneTime(),
        });
      }
    } catch (error) {
      console.log("onRegistration error: ", error);
    }
  }

  async onClickOneWorkingTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "one_working_time") {
          const one_working_time = ctx.callbackQuery!["data"].split("__")[1];
          master.one_working_time = one_working_time;
          master.last_state = "is_confirmed";
          await master.save();

          await ctx.reply("Tasdiqlaysizmi:", {
            ...Markup.keyboard([["Tasdiqlash✅", "Bekor qilish❌"]]).resize(),
          });
        }
      }
    } catch (error) {
      console.log("onClickOneWorkingTime error: ", error);
    }
  }

  async onClickEndWorkTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "end_work_time") {
          const end_work_time = ctx.callbackQuery!["data"].split("__")[1];
          console.log(end_work_time);

          master.end_work_time = end_work_time;
          master.last_state = "one_working_time";
          await master.save();

          await ctx.reply(
            "Har bir mijoz uchun o'rtacha sarflanadigan vaqtni tanlang:",
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "15 daqiqa🕒",
                      callback_data: "one_working_time__15",
                    },
                  ],
                  [
                    {
                      text: "30 daqiqa🕞",
                      callback_data: "one_working_time__30",
                    },
                  ],
                  [{ text: "1 soat🕐", callback_data: "one_working_time__60" }],
                ],
              },
            }
          );
        }
      }
    } catch (error) {
      console.log("onClickEndWorkTime error: ", error);
    }
  }

  async onClickCallAdmin(ctx: Context) {
    try {
      const master_id = ctx.callbackQuery!["data"].split("__")[1];
      console.log(master_id);

      const master = await this.masterModel.findOne({
        where: { user_id: master_id },
        order: [["id", "DESC"]],
      });

      if (master) {
        console.log(master.phone_number);

        await ctx.reply(
          "Adminga telefon raqamingiz yuborilsinmi, sizga shu raqam orqali aloqaga chiqishadi",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Ha✅",
                    callback_data: `send_admin__${master.phone_number}`,
                  },
                ],
              ],
            },
          }
        );
      }
    } catch (error) {
      console.log("onClickCallAdmin error: ", error);
    }
  }
  async onSendPhoneNumber(ctx: Context) {
    try {
      const master_phoneNumber = ctx.callbackQuery!["data"].split("__")[1];
      if (master_phoneNumber) {
        this.bot.telegram.sendMessage(
          process.env.ADMIN!,
          `Sizga ushbu raqam bilan murojat tushdi ${master_phoneNumber}`
        );
        await ctx.reply("Qabul qilindi✅");
      }
    } catch (error) {
      console.log("onSendPhoneNumber error: ", error);
    }
  }
  async onClickRejectMaster(ctx: Context) {
    try {
      const master_id = ctx.callbackQuery!["data"].split("__")[1];
      const master = await this.masterModel.findOne({
        where: { id: master_id },
        order: [["id", "DESC"]],
      });
      if (master) {
        if (!master.is_confirmed && master.last_state == "is_confirmed") {
          await master.destroy();
          console.log(master);

          await ctx.reply(
            "Sizning so'rvingiz muvaffaqqiyatli bekor qilindi ✅",
            {
              ...Markup.keyboard([["Ro'yxatdan o'tish 👨‍💻"]])
                .resize()
                .oneTime(),
            }
          );
        }
      }
    } catch (error) {
      console.log("onClickRejectMaster error: ", error);
    }
  }
  async onClickCheckAction(ctx: Context) {
    try {
      const master_id = ctx.callbackQuery!["data"].split("_")[1];
      const master = await this.masterModel.findOne({
        where: { id: master_id },
        order: [["id", "DESC"]],
      });
      if (master) {
        if (!master.is_confirmed && master.last_state == "is_confirmed") {
          await ctx.reply("Sizning so'rovingiz hali tasdiqlanganicha yo'q 🤷‍♂️");
        } else if (!master.is_confirmed && master.last_state == "finish") {
          await ctx.reply(
            "Sizning so'rovingiz rad etilgan ❌\n<i>Qaytadan ro'yxatdan o'tishingiz mumkin</i>",
            {
              parse_mode: "HTML",
              ...Markup.keyboard([["Usta 👨‍🔧", "Mijoz 👤"]])
                .resize()
                .oneTime(),
            }
          );
        } else if (master.is_confirmed && master.last_state == "finish") {
          await ctx.reply("Sizning so'rovingiz tasdiqlangan ✅", {
            ...Markup.keyboard([
              ["Mijozlar 👤", "Vaqt🕒", "Reyting 📈"],
              ["Ma'lumotlarni o'zgartirish 📝"],
            ]).resize(),
          });
        }
      }
    } catch (error) {
      console.log("onClickCheckAction error: ", error);
    }
  }
  async onClickCustomerProfession(ctx: Context) {
    try {
      const profession_id = ctx.callbackQuery!["data"].split("__")[1];
      const profession = await this.professionModel.findOne({
        where: { id: profession_id, last_state: "finish" },
        order: [["id", "DESC"]],
      });
      if (profession) {
        await ctx.reply(`Qanday tarzda qidirmoqchisiz:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "ISM", callback_data: `serch_name_${profession.id}` }],
              [
                {
                  text: "REYTING",
                  callback_data: `serch_rating_${profession.id}`,
                },
              ],
              [
                {
                  text: "LOKATSIYA",
                  callback_data: `serch_location_${profession.id}`,
                },
              ],
            ],
          },
        });
        if (ctx.callbackQuery?.message?.message_id) {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        }
      }
    } catch (error) {
      console.log("onClickCustomerProfession error: ", error);
    }
  }
  async onClickSearchName(ctx: Context) {
    try {
      console.log(ctx.callbackQuery?.from.id);
      
      const customer = await this.customerModel.findOne({
        where: { user_id: Number(ctx.callbackQuery?.from.id) },
      });
      if (customer) {
        
        const profession_id = ctx.callbackQuery!["data"].split("_").at(-1);
        
        const profession = await this.professionModel.findOne({
          where: { id: profession_id },
        });
        if (profession) {
          customer.search_type = `name_${profession.id}`;
          await customer.save();

          await ctx.reply("Usta ismini kiriting:", {
            ...Markup.removeKeyboard(),
          });
        }
      }
    } catch (error) {
      console.log("onClickSearchName error: ", error);
    }
  }

  async onClickCinfirmForAdmin(ctx: Context) {
    try {
      const master_id = ctx.callbackQuery!["data"].split("_")[1];
      const master = await this.masterModel.findOne({
        where: { id: master_id, last_state: "is_confirmed" },
        order: [["id", "DESC"]],
      });
      if (master) {
        master.last_state = "finish";
        master.is_confirmed = true;
        await master.save();

        await this.bot.telegram.sendMessage(
          master.user_id!,
          "Sizning so'rovingiz muvaqqiyatli tasdiqlandi",
          {
            ...Markup.keyboard([
              ["Mijozlar 👤", "Vaqt🕒", "Reyting ⭐️"],
              ["Ma'lumotlarni o'zgartirish 📝"],
            ]).resize(),
          }
        );
      }
    } catch (error) {
      console.log("onClickCinfirmForAdmin error: ", error);
    }
  }

  async onClickRejectForAdmin(ctx: Context) {
    try {
      const master_id = ctx.callbackQuery!["data"].split("_")[1];
      const master = await this.masterModel.findOne({
        where: { id: master_id, last_state: "is_confirmed" },
        order: [["id", "DESC"]],
      });
      if (master) {
        master.last_state = "finish";
        master.is_confirmed = false;
        await master.save();

        await this.bot.telegram.sendMessage(
          master.user_id!,
          "Kechirasiz sizning so'rovingiz rad etildi😔",
          {
            ...Markup.keyboard([["Ro'yxatdan o'tish 👨‍💻"]])
              .resize()
              .oneTime(),
          }
        );
      }
    } catch (error) {
      console.log("onClickRejectForAdmin error: ", error);
    }
  }

  async onClickStartWorkTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "start_work_time") {
          const start_work_time = ctx.callbackQuery!["data"].split("__")[1];
          master.start_work_time = start_work_time;
          master.last_state = "end_work_time";
          await master.save();

          await ctx.reply("Iltimos ish tugash vaqtingizni kiriting:", {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "13:00 ☀️", callback_data: "end_work_time__13" },
                  { text: "14:00 ☀️", callback_data: "end_work_time__14" },
                  { text: "15:00 ☀️", callback_data: "end_work_time__15" },
                  { text: "16:00 ☀️", callback_data: "end_work_time__16" },
                ],
                [
                  { text: "17:00 🌄", callback_data: "end_work_time__17" },
                  { text: "18:00 🌄", callback_data: "end_work_time__18" },
                  { text: "19:00 🌄", callback_data: "end_work_time__19" },
                  { text: "20:00 🌙", callback_data: "end_work_time__20" },
                ],
                [
                  { text: "21:00 🌙", callback_data: "end_work_time__21" },
                  { text: "22:00 🌙", callback_data: "end_work_time__22" },
                  { text: "23:00 🌙", callback_data: "end_work_time__23" },
                ],
              ],
              remove_keyboard: true,
            },
          });
        }
      }
    } catch (error) {
      console.log("onClickStartWorkTime error: ", error);
    }
  }

  async onClickProfession(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (user) {
        const profession_id = ctx.callbackQuery!["data"].split("_")[1];
        if (profession_id) {
          const profession =
            await this.professionModel.findByPk(+profession_id);

          if (profession) {
            const newMaster = await this.masterModel.create({
              user_id,
              profession_id: profession.id,
              last_state: "name",
            });

            await ctx.reply("Iltimos Ismingizni kiriting:", {
              ...Markup.removeKeyboard(),
            });
          }
        }
      }
    } catch (error) {
      console.log("onClickProfession error: ", error);
    }
  }

  async onClickMaster(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (user) {
        user.role = "master";
        await user.save();
        const professions = await this.professionModel.findAll({
          where: { last_state: "finish" },
        });
        let replyProfessions: any[] = [];

        professions.forEach((profession) =>
          replyProfessions.push([
            {
              text: profession.name,
              callback_data: `profession_${profession.id}`,
            },
          ])
        );

        await ctx.reply("Iltimos ish turini tanlang: ", {
          reply_markup: {
            inline_keyboard: replyProfessions,
          },
        });
      }
    } catch (error) {
      console.log("onClickMaster error: ", error);
    }
  }
  async onClickCustomer(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      let customer = await this.customerModel.findOne({ where: { user_id } });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (user) {
        if (!customer) {
          await this.customerModel.create({ user_id, last_state: "name" });
          customer = await this.customerModel.findOne({ where: { user_id } });
        }
        if (customer?.last_state == "name") {
          await ctx.reply("Iltimos ismingizni kiriting: ", {
            ...Markup.removeKeyboard(),
          });
        } else if (customer?.last_state == "phone_number") {
          await ctx.reply("📞 Iltimos raqamingizni ulashing: ", {
            ...Markup.keyboard([
              Markup.button.contactRequest("Telefon raqamni ulashish 📞"),
            ]).resize(),
          });
        } else if (customer?.last_state == "finish") {
          await ctx.reply("Siz oldin ro'yxatdan o'tgansiz:", {
            ...Markup.keyboard([
              ["Xizmatlar", "Tanlangan Xizmatlar"],
              ["Ma'lumotlarni o'zgartirish"],
            ]).resize(),
          });
        }
      }
    } catch (error) {
      console.log("onClickCustomer error: ", error);
    }
  }

  async onCommanAdmin(ctx: Context) {
    try {
      await ctx.reply("Kasb qo'shish uchun <b>Kasb qo'shish 🧑‍💻</b> ni bosing", {
        parse_mode: "HTML",
        ...Markup.keyboard([["Kasb qo'shish 🧑‍💻"]])
          .resize()
          .oneTime(),
      });
    } catch (error) {
      console.log("onCommanAdmin error: ", error);
    }
  }

  async onAddProfession(ctx: Context) {
    try {
      const newProfession = await this.professionModel.create({
        last_state: "name",
      });
      await ctx.reply("Kasb nomini kiriting masalan <b>Tikuvchi</b>", {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log("onAddPerfission error ", error);
    }
  }

  async onLocation(ctx: Context) {
    try {
      if ("location" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user || !user.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        } else {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "location") {
            master.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
            master.last_state = "start_work_time";
            await master.save();
            await ctx.reply("Iltimos ish boshlash vaqtingizni kiriting:", {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "07:00 🌅", callback_data: "start_work_time__7" },
                    { text: "08:00 🌅", callback_data: "start_work_time__8" },
                    { text: "09:00 🌅", callback_data: "start_work_time__9" },
                  ],
                  [
                    { text: "10:00 ☀️", callback_data: "start_work_time__10" },
                    { text: "11:00 ☀️", callback_data: "start_work_time__11" },
                    { text: "12:00 ☀️", callback_data: "start_work_time__12" },
                  ],
                ],
                remove_keyboard: true,
              },
            });
          }
        }
      }
    } catch (error) {
      console.log("OnLocationError: ", error);
    }
  }

  async onSkip(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (user && user.status) {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "workshop_name") {
            master.workshop_name = "";
            master.last_state = "address";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz manzilini kiriting</b> masalan <b>Amir Temur hiyoboni</b> \n<i>(majburiy emas)</i>",
              Markup.keyboard(["Tashlab ketish ➡️"]).resize()
            );
          } else if (master && master.last_state == "address") {
            master.address = "";
            master.last_state = "location";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz lokatsiyasini jo'nating:</b>\n<i>kartadan topib yuborish tavsiya etiladi</i>",
              Markup.keyboard([
                [Markup.button.locationRequest("Hozir turgan joyingiz📍")],
              ]).resize()
            );
          }
        }
      }
    } catch (error) {
      console.log("onSkip error: ", error);
    }
  }

  async onClickReyting(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const master = await this.masterModel.findOne({
          where: { user_id: user_id, last_state: "finish" },
          order: [["id", "DESC"]],
        });

        if (!master) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (master) {
          const masterRating = (await this.ratingModel.findOne({
            attributes: [
              [
                this.ratingModel.sequelize!.fn(
                  "AVG",
                  this.ratingModel.sequelize!.col("rating_number")
                ),
                "avg_rating",
              ],
            ],
            where: { master_id: master.id },
            raw: true, // Natijani oddiy object ko'rinishida olish uchun
          })) as unknown as { avg_rating: number };

          if (!masterRating?.avg_rating) {
            await ctx.reply("Hozircha sizning reytingingiz 0 ga teng 😕", {
              ...Markup.keyboard([
                ["Mijozlar 👤", "Vaqt🕒", "Reyting ⭐️"],
                ["Ma'lumotlarni o'zgartirish 📝"],
              ]).resize(),
            });
          } else {
            await ctx.reply(
              `Hozircha sizning reytingingiz <b>${parseFloat(Number(masterRating.avg_rating).toString()).toFixed(1)}⭐️</b> ga teng`,
              {
                parse_mode: "HTML",
                ...Markup.keyboard([
                  ["Mijozlar 👤", "Vaqt🕒", "Reyting ⭐️"],
                  ["Ma'lumotlarni o'zgartirish 📝"],
                ]).resize(),
              }
            );
          }
        }
      }
    } catch (error) {
      console.log("onClickReyting error: ", error);
    }
  }
  async onClickSelectedServices(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const customer = await this.customerModel.findOne({
          where: { user_id: user_id, last_state: "finish" },
        });

        if (customer) {
          const selectedServices = await this.selectedServicesModel.findAll({
            where: { customerId: customer.id },
            include: { all: true },
          });
          if (!selectedServices) {
            await ctx.reply("Hozircha hech qanday xizmatdan foydalanmagansiz", {
              ...Markup.keyboard([
                ["Xizmatlar", "Tanlangan Xizmatlar"],
                ["Ma'lumotlarni o'zgartirish"],
              ]),
            });
          } else if (selectedServices) {
            for (let service of selectedServices) {
              if (service.last_state != "finish") {
                await ctx.replyWithHTML(
                  `Xizmat nomi: <b>${service.profession.name!}</b>\nSana: <b>${service.createdAt}</b>\nVaqt: <b>${service.time}</b>`,
                  {
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: "Manzilni ko'rish",
                            callback_data: `service_location__${service.master.id}`,
                          },
                        ],
                      ],
                    },
                  }
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.log("onClickSelectedServices error: ", error);
    }
  }
  async onClickServices(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const customer = await this.customerModel.findOne({
          where: { user_id: user_id, last_state: "finish" },
        });

        if (customer) {
          const professions = await this.professionModel.findAll({
            where: { last_state: "finish" },
          });
          if (!professions) {
            await ctx.reply("Hozircha hech qanday xizmatlar mavjud emas", {
              ...Markup.keyboard([
                ["Xizmatlar", "Tanlangan Xizmatlar"],
                ["Ma'lumotlarni o'zgartirish"],
              ]),
            });
          } else if (professions) {
            let replyKeyboard: any[] = [];
            for (const profession of professions) {
              replyKeyboard.push([
                {
                  text: profession.name,
                  callback_data: `customer_click_profession__${profession.id}`,
                },
              ]);
            }
            await ctx.reply("Xizmatlar:", {
              reply_markup: {
                inline_keyboard: replyKeyboard,
              },
            });
          }
        }
      }
    } catch (error) {
      console.log("onClickServices error: ", error);
    }
  }

  async onConfirmed(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (user && user.status) {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "is_confirmed") {
          await this.bot.telegram.sendMessage(
            process.env.ADMIN!,
            `Sizga tasdiqlash uchun so'rov keldi:\nUsta ismi: ${master.name}\nUstaxona nomi: ${master.workshop_name}\nIsh boshlash vaqti: ${master.start_work_time}\nIsh tugash vaqti: ${master.end_work_time}\nTelefon raqami: ${master.phone_number}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Tasdiqlash ✅",
                      callback_data: `confirm_${master.id}`,
                    },
                  ],
                  [
                    {
                      text: "Rad etish ❌",
                      callback_data: `rejected_${master.id}`,
                    },
                  ],
                ],
              },
            }
          );
          await ctx.reply("Tasdiqlash xabari muvaqqiyatli yuborildi:", {
            ...Markup.removeKeyboard(),
          });
          await ctx.reply(
            "Tez fursatlarda admin tomonidan so'rovingizga javob qaytariladi:",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Tekshirish 🛠️",
                      callback_data: `check_${master.id}`,
                    },
                    {
                      text: "Bekor qilish ❌",
                      callback_data: `reject_master__${master.id}`,
                    },
                  ],
                  [
                    {
                      text: "Admin bilan bog'lanish 📞",
                      callback_data: `call_admin__${user_id}`,
                    },
                  ],
                ],
              },
            }
          );
        }
      }
    } catch (error) {
      console.log("onConfirmed error: ", error);
    }
  }

  async onContact(ctx: Context) {
    try {
      if ("contact" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);
        if (!user) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (user && user.status) {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state === "phone_number") {
            master.phone_number = ctx.message.contact.phone_number;
            master.last_state = "workshop_name";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz nomini kiriting</b> <i>(majburiy emas)</i>:",
              Markup.keyboard(["Tashlab ketish ➡️"]).resize()
            );
          } else {

            const customer = await this.customerModel.findOne({
              where: { user_id },
            });
            
            if (customer && customer.last_state == 'phone_number') {
              customer.phone_number = ctx.message.contact.phone_number;
              customer.last_state = "finish";
              await customer.save();
              await ctx.reply(
                "Tabriklayman siz muvaffaqqiyatli ro'yxatdan o'ttingiz",
                {
                  ...Markup.keyboard([
                    ["Xizmatlar", "Tanlangan Xizmatlar"],
                    ["Ma'lumotlarni o'zgartirish"],
                  ]).resize(),
                }
              );
            }
          }
        }
      }
    } catch (error) {
      console.log("onText error: ", error);
    }
  }

  async onText(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (user && user.status) {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "name") {
            master.name = ctx.message.text;
            master.last_state = "phone_number";
            await master.save();
            await ctx.reply(
              "Iltimos, telefon raqamingizni ulashing:",
              Markup.keyboard([
                [Markup.button.contactRequest("📞 Kontaktni ulashish")],
              ]).resize()
            );
          } else if (master && master.last_state == "workshop_name") {
            master.workshop_name = ctx.message.text;
            master.last_state = "address";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz manzilini kiriting</b> masalan <b>Amir Temur hiyoboni</b> \n<i>(majburiy emas)</i>",
              Markup.keyboard(["Tashlab ketish ➡️"]).resize()
            );
          } else if (master && master.last_state == "address") {
            master.address = ctx.message.text;
            master.last_state = "location";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz lokatsiyasini jo'nating:</b>\n<i>kartadan topib yuborish tavsiya etiladi</i>",
              Markup.keyboard([
                [Markup.button.locationRequest("Hozir turgan joyingiz📍")],
              ]).resize()
            );
          } else {
            const customer = await this.customerModel.findOne({
              where: { user_id },
            });
            if (customer && customer.last_state == "name") {
              customer.name = ctx.message.text;
              customer.last_state = "phone_number";
              await customer.save();

              await ctx.reply("Iltimos telefon raqamingizni ulashing:",{
                ...Markup.keyboard([Markup.button.contactRequest("Telefon raqamni ulashish📞")]).resize()
              })

            } else if (
              customer?.search_type &&
              /^name_+\d+/.test(customer.search_type)
            ) {
              const profession_id = customer.search_type.split("_")[1];
              const masters = await this.masterModel.findAll({
                where: {
                  profession_id: +profession_id,
                  last_state: "finish",
                  name: { [Op.iLike]: ctx.message.text },
                },
              });
              for (const master of masters) {
                await ctx.reply(
                  `ISMI - ${master.name}\nTELEFON RAQAMI - ${master.phone_number}\nUSTAXONA NOMI - ${master.workshop_name}\nMANZILI - ${master.address}\n`,
                  {
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: "Lokatsiya",
                            callback_data: `master_location__${master.id}`,
                          },
                          {
                            text: "Vaqt olish",
                            callback_data: `master_time__${master.id}`,
                          },
                        ],
                        [
                          {
                            text: "Baholash",
                            callback_data: `master_reyting__${master.id}`,
                          },
                          {
                            text: "Ortga ⬅️",
                            callback_data: `customer_click_profession__${profession_id}`,
                          },
                        ],
                      ],
                    },
                  }
                );
              }
            }
          }
        }

        if (user_id == process.env.ADMIN) {
          const profession = await this.professionModel.findOne({
            where: {
              last_state: "name",
            },
            order: [["id", "DESC"]],
          });
          if (profession && !profession.name) {
            profession.name = ctx.message.text;
            profession.last_state = "finish";
            await profession.save();

            await ctx.replyWithHTML("Yangi kasb muvaffaqqiyatli saqlandi✅", {
              ...Markup.removeKeyboard(),
            });
          }
        }
      }
    } catch (error) {
      console.log("onText error: ", error);
    }
  }
}
