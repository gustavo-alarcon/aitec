"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.QuestionsComponent = void 0;
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
var QuestionsComponent = /** @class */ (function () {
    function QuestionsComponent(questionsService, formbuilder, authService) {
        this.questionsService = questionsService;
        this.formbuilder = formbuilder;
        this.authService = authService;
        this.now = new Date();
        this.questionForm = new forms_1.FormGroup({
            question: new forms_1.FormControl('')
        });
        this.questions = [];
        this.searchProductId = [];
        this.question = {};
        this.formQuestionSubmit = false;
        this.questionForm = this.formbuilder.group({
            question: ['', forms_1.Validators.required]
        });
    }
    /* getXlsDate(date) {
      let dateObj = new Date(1970);
      dateObj.setSeconds(date['seconds'])
      return this.datePipe.transform(dateObj, 'dd/MM/yyyy');
    } */
    QuestionsComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.questionsService.getQuestions(this.idProduct).subscribe(function (questions) {
            _this.questions = questions;
        });
    };
    Object.defineProperty(QuestionsComponent.prototype, "frm", {
        get: function () {
            return this.questionForm.controls;
        },
        enumerable: false,
        configurable: true
    });
    QuestionsComponent.prototype.saveQuestion = function () {
        this.question.question = this.questionForm.get('question').value;
        this.question.createdAt = this.now;
        this.question.answer = "";
        //this.question.createdBy=this.authService.getUser$;
        this.formQuestionSubmit = true;
        if (this.questionForm.valid) {
            this.questionsService.saveQuestion(this.idProduct, this.question);
        }
        console.warn(this.questionForm.value);
        this.questionForm.reset();
    };
    __decorate([
        core_1.Input()
    ], QuestionsComponent.prototype, "idProduct");
    QuestionsComponent = __decorate([
        core_1.Component({
            selector: 'app-questions',
            templateUrl: './questions.component.html',
            styleUrls: ['./questions.component.scss']
        })
    ], QuestionsComponent);
    return QuestionsComponent;
}());
exports.QuestionsComponent = QuestionsComponent;
