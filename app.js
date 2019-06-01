const budgetApp = (()=>{

    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    const modelCtrlModule = (()=>{

        const data = {
            items: {
                income: [],
                expense: []
            }
        }

        function BudgetItem() {}
        Object.defineProperty(BudgetItem.prototype, 'type', {
            get() {
                return this instanceof Income ? 'income' : this instanceof Expense ? 'expense' : undefined;
            }
        });
        Object.prototype.getId = function() {
            let eid = 0;
            let iid = 0;
            return function(type){ return type instanceof Expense ? eid++ : iid++};
        }();
        Object.prototype.getPercentageOfIncome = function(ttlIncome=0) {
            if(this.amount === 0 || ttlIncome === 0) {
                return 0;
            } else {
                return this.amount / ttlIncome * 100;
            }
        };

        function Expense(item) {
            this.id = this.getId(this);
            this.description = item.description;
            this.amount = item.amount;
        }
        Expense.prototype = Object.create(BudgetItem.prototype);

        function Income(item) {
            this.id = this.getId(this);
            this.description = item.description;
            this.amount = item.amount;
        }
        Income.prototype = Object.create(BudgetItem.prototype);

        function addItem(item) {
            if(item.type === 'income') {
                const newIncome = new Income(item);
                data.items.income.push(newIncome);
                return newIncome;
            } else {
                const newExpense = new Expense(item);
                data.items.expense.push();
                return newExpense;
            }
        }

        return {
            addItem,
            data
        }
    })();
    
    const viewCtrlModule = (()=>{
        const elements = {
            header: {
                title: $('.ba__top__header_title'),
                date: $('.ba__top__header_date')
            },
            display: {
                total: $('.ba__top__display__total_text'),
                income : {
                    total: $('.ba__top__summary__income__text_value'),
                    percentage: $('.ba__top__summary__income__text_percentage')
                },
                expense : {
                    total: $('.ba__top__summary__expense__text_value'),
                    percentage: $('.ba__top__summary__expense__text_percentage')
                }
            },
            form: {
                el: $('.ba__top__form'),
                type: $('.ba__top__form_type'),
                description: $('.ba__top__form_description'),
                amount: $('.ba__top__form_amount'),
                submit: $('.ba__top__form_submit')
            },
            lists: {
                income: $('.list--income'),
                expense: $('.list--expense')
            },
            tabs: {
                income: $('#tab-income'),
                expense: $('#tab-expense'),
                both: $('#tab-both')
            },
            bottom: $('.ba__bottom')
        }

        const templates = {
            item: (item) => {
                return `
                    <div class="list__item list__item--${item.type}">
                        <div class="col col--description">${item.description}</div>
                        <div class="col flex">
                            <div class="col col--amount flex flex-jce">${item.amount}</div>
                            <div class="col col--percentage flex flex-jce">
                                <div>${item.getPercentageOfIncome()}%</div>
                            </div>
                        </div>
                    </div>
                `
            }
        }

        function addItem(item) {
            elements.lists[item.type].insertAdjacentHTML('afterbegin', templates.item(item));
        }
        return {
            addItem,
            elements
        }
    })();
    
    const mainCtrlModule = ((view, model)=>{
        
        function init() {
            // init event listeners
            view.elements.form.el.addEventListener('submit', onAddItem);
            view.elements.tabs.income.addEventListener('click', onTabClick);
            view.elements.tabs.expense.addEventListener('click', onTabClick);
            view.elements.tabs.both.addEventListener('click', onTabClick);
            // remove after dev
            for (let i = 0; i < 50; i++) {
                view.elements.form.type.value = Math.random() > 0.5 ? 'income' : 'expense';
                view.elements.form.description.value = 'test tester';
                view.elements.form.amount.value = (Math.random() * 200).toFixed(2);
                view.elements.form.submit.click();
            }
            // init tabs
            view.elements.tabs.income.click();
        }

        function onAddItem(e) {
            e.preventDefault();
            // add to model
            const item = model.addItem({
                type: view.elements.form.type.value,
                description: view.elements.form.description.value,
                amount: +view.elements.form.amount.value
            });
            // add to view
            view.addItem(item);
        }

        function onTabClick(e) {
            const id = e.currentTarget.id;
            const type = id.split('-')[1];
            for (const key in view.elements.tabs) {
                if (view.elements.tabs.hasOwnProperty(key)) {
                    const tab = view.elements.tabs[key];
                    tab.classList.remove('active');
                    if(tab.id === id) {
                        tab.classList.add('active');
                    }
                }
                view.elements.bottom.classList.remove(`ba__bottom--${key}`);
            }
            view.elements.bottom.classList.add(`ba__bottom--${type}`);
        }
    
        return {
            init,
            view,
            model
        }
    
    })(viewCtrlModule, modelCtrlModule);
    
    return {
        main: mainCtrlModule,
    }
    
})();


// console.log(budgetApp.main.view.elements);

budgetApp.main.init();