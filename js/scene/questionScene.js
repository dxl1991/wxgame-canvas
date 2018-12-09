import questionList from '../data/questions.js'
import {drawText} from '../utils/index.js';
import Background from '../runtime/background';
import Sprite from '../base/Sprite';
import DataStore from "../base/DataStore";
import Music from '../../music'
// 采用750的设计稿
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const ratio = 750 / screenWidth;//wx.getSystemInfoSync().pixelRatio;
const scale = 750 / screenWidth;

const CHOICE_WIDTH = 288;
const CHOICE_HEIGHT = 88;
var music = new Music();
// 创建问题canvas, 离屏canvas
export default class QuestionPage{
    constructor(ctx, question, index) {
        this.background = new Background(ctx, scale);

        this.question = question;
        this.index = index;
        this.ctx = ctx;
        this.selected = false;
        this.init(this.question);
        this.drawScore();
        this.drawProgress();
        this.drawPic();
        this.drawTitle();
        this.drawChoice();
        this.addTouch();

      this.offScreenCanvas = wx.createCanvas();
      this.offScreenCanvas.width = screenWidth * ratio;
      this.offScreenCanvas.height = screenHeight * ratio;
      this.questionCtx = this.offScreenCanvas.getContext('2d');
      this.questionCtx.scale(ratio, ratio);


        this.countDownNum = 5;
        this.countDown();
        this.drawCountDown();
    }
    countDown(){
      this.t = setTimeout(() => {
        this.countDownNum--;
        this.drawCountDown();
        if (this.countDownNum === 0){
          this.selected = true;
          this.judgeAnswer(0, 0, false);
        }else{
          this.countDown();
        }
      }, 1000);
    }
    init(data) {
        this.img = data.pic;
        this.title = data.title;
        this.choices = data.choices;
        this.answer = data.answer;
    }
    drawScore(){
      let mscore = wx.getStorageSync('maxScore');
      if(!mscore){
        mscore = 0;
      }
      this.ctx.font = '28px Arial';
      this.ctx.fillStyle = '#654e01';
      this.ctx.fillText("历史最高分：", 180, 55);
      this.ctx.fillStyle = '#4F4F4F';
      this.ctx.fillText(mscore, 350, 55);
      this.ctx.fillStyle = '#654e01';
      this.ctx.fillText("当前分：", 180, 95);
      this.ctx.fillStyle = '#4F4F4F';
      this.ctx.fillText(DataStore.getInstance().score, 300, 95);
      this.ctx.fillStyle = '#654e01';
      this.ctx.fillText("倒计时：", 180, 135);
    }

    drawCountDown(){
      this.questionCtx.clearRect(0, 0, screenWidth * ratio, screenHeight * ratio);
      // this.offScreenCanvas.height = screenHeight * ratio;

      console.log("绘制倒计时" + this.countDownNum);
      // this.ctx.clearRect(300, 135,20,20);
      // this.questionCtx.fillRect(300, 135, 20, 20);
      this.questionCtx.font = "bold 40pt Arial";
      this.questionCtx.fillStyle = "red";
      this.questionCtx.textAlign = "center";
      this.questionCtx.textBaseline = 'middle';
      this.questionCtx.fillText(this.countDownNum + "s", 300, 135);

      this.ctx.drawImage(this.offScreenCanvas, 0, 0, screenWidth, screenHeight);

      this.reDrawCanvas();
      // questionCtx.fillText(this.countDownNum + "s", 300, 135);
      // drawText(this.countDownNum+"s", 300, 135, 750 - 2 * this.bg.x, this.ctx, ratio);
      
    }
    drawProgress () {
        let barImg = Sprite.getImage('progress_bar');
        let bar = new Sprite(barImg, (750 - barImg.width)/2, 20, barImg.width, barImg.height);
        // bar.draw(this.ctx);
        let percent = (this.index+1)/10;
        // this.ctx.globalCompositeOperation = 'source-over';
        // this.ctx.fillStyle = '#fed443';
        // this.ctx.fillRect(bar.x+4, bar.y+82, (bar.width-8)*percent, 16);
        this.bar = bar;
    }
    drawPic() {
        let _this = this;
        let bgImg = Sprite.getImage('question_bg');
        this.offset = (750 - bgImg.width)/2;
        let bg = new Sprite(bgImg, this.offset, 20 + this.bar.height + 20, bgImg.width, bgImg.height);
        bg.draw(this.ctx);
        this.bg = bg;
        let pic = new Image();
        pic.src = this.img;
        pic.onload = () => {
            _this.centerImg(pic, bg.x + 20, bg.y + 20, bg.width-40, bg.height-40);
            _this.reDrawCanvas();
        }
    }
    drawTitle () {
        drawText(this.title, this.offset, this.bg.y+this.bg.height+20, 750-2*this.bg.x, this.ctx, ratio);
    }
    // 图片居中
    centerImg(pic,x,y,limitW,limitH) {
        let drawWidth = pic.width;
        let drawHeight = pic.height;
        if(drawWidth/drawHeight>1){
            drawHeight = limitW * (drawHeight / drawWidth);
            drawWidth = limitW;
            y = y + (limitH - drawHeight) / 2;
        } else {
            drawWidth = limitH * (drawWidth / drawHeight);
            drawHeight = limitH;
            x = x + (limitW - drawWidth) / 2;
        }

        this.ctx.drawImage(pic,x,y,drawWidth,drawHeight);
    }
    drawChoiceItem (index, bgsrc, callback) {
        this.ctx.globalCompositeOperation = 'source-over';
        let chart = ['A', 'B', 'C', 'D'];
        let choiceBgImg = Sprite.getImage(bgsrc);

        let x = index%2 === 0 ? this.offset : ((750-CHOICE_WIDTH)-this.offset);
        this.firstY = this.bg.y + this.bg.height+20*ratio+90;
        this.secondY = this.firstY + 20*ratio;
        let y = index < 2 ? this.firstY : (this.secondY + CHOICE_HEIGHT);
        let choiceSprite = new Sprite(choiceBgImg, x , y, CHOICE_WIDTH, CHOICE_HEIGHT);
        choiceSprite.draw(this.ctx);
        this.drawCircle(this.ctx, x + 40, y + 50, chart[index]);
        this.ctx.fillStyle = '#654e01';
        this.ctx.fillText(this.choices[index], x + 80, y + 50);

        if (bgsrc != 'select_bg') {
            callback && callback();
            return;
        }
        // 选项的选择区域
        if (!this.selectArea) {
            console.log(choiceSprite);
            this.selectArea = {
                x: choiceSprite.x/ratio,
                y: choiceSprite.y/ratio,
                endX: screenWidth - this.offset/ratio,
                endY: this.firstY/ratio + (choiceSprite.height/ratio)*2+20,
                width: choiceSprite.width/ratio,
                height: choiceSprite.height/ratio
            }
        }
        if (index === 1) { // 记B选项的X坐标
            this.selectArea.rightX = (screenWidth-choiceSprite.width/ratio)-this.offset/ratio;
        }
        if (index === 2) { // 记C选项的Y坐标
            this.selectArea.bottomY = this.secondY + choiceSprite.height/ratio;
        }
    }
    drawChoice(ctx) {
        this.ctx.font = '24px Arial';
        for (let i = 0; i < 4; i++) {
            this.drawChoiceItem(i, 'select_bg');
        }
    }
    drawCircle(ctx,x,y,text,isGray){
        // ctx.fillStyle = !isGray?"#ecb020":"#bcb7a7";
        ctx.fillStyle = '#ecb020';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "#654e01";
        ctx.font = '24px Arial';
        ctx.fillText(text, x-8, y);
    }
    // 判断答案是否正确
    judgeAnswer (x, y, s) {
        let index;
        let time = 1000;
        if (x <= this.selectArea.x + this.selectArea.width) { // a  c  无
            index = y < (this.selectArea.y + this.selectArea.height) ? 0 : 2;
        } else if (x > this.selectArea.rightX) { // b  d
            index = y < (this.selectArea.y + this.selectArea.height) ? 1 : 3;
        } else {
            this.selected = false;
            return;
        }
        if(this.t){
           clearTimeout(this.t);
        }
        console.log('select: ' + index);
      if (index === this.answer && s === true) {
            DataStore.getInstance().score += 10;
            this.drawChoiceItem(index, 'select_right',this.reDrawCanvas);
        } else {
           if (s === true){
              this.drawChoiceItem(index, 'select_error',this.reDrawCanvas);
            }
        DataStore.getInstance().director.gameOver = 1;
            time += 800;
            setTimeout(() => {
                this.drawChoiceItem(this.answer, 'right_choice',this.reDrawCanvas);
            }, 800);
        }

        setTimeout(() => {
            DataStore.getInstance().director.nextQuestionScene();
        }, time);


    }
    // 重新绘制canvas 到主屏上
    reDrawCanvas() {
        DataStore.getInstance().ctx.drawImage(DataStore.getInstance().offScreenCanvas, 0, 0, screenWidth, screenHeight);
    }
    addTouch(){
        let _this = this;
        wx.offTouchStart();
        wx.onTouchStart((e)=>{
          console.log(e.touches[0].clientX + "," + e.touches[0].clientY);
            if (!this.selected
                &&e.touches[0].clientX >= _this.selectArea.x
                && e.touches[0].clientX <= _this.selectArea.endX
                && e.touches[0].clientY >= _this.selectArea.y
                && e.touches[0].clientY <= _this.selectArea.endY){
                this.selected = true;
                _this.judgeAnswer(e.touches[0].clientX, e.touches[0].clientY,true);
                music.playShoot();
            }
        });
    }
}