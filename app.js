const budgetApp = (()=>{

    const utils = {
        formatNumber: (num) => {
            const out = num.toFixed(2);
            if(Math.abs(num)<1000) {
                return `${out}`;
            }
            let [dollars, cents] = out.split('.');
            dollars = dollars.split('').reverse().reduceRight((p,c,i,a)=>{
                let out = c;
                    if(i>0 && i%3===0) out += ',';
                    return p += out;
                },'');
            return `${dollars}.${cents}`;
        },
        formatPercentage(num, places=0) {
            num = Math.abs(num);
            return num.toFixed(places);
        }
    }

    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    const modelCtrlModule = (()=>{

        const data = {
            items: {
                income: [],
                expense: []
            },
            totals: {
                income: () => data.items.income.reduce((p,c,i,a)=>p+=c.amount,0),
                expense: () => -data.items.expense.reduce((p,c,i,a)=>p+=c.amount,0),
                total: () => data.totals.income() + data.totals.expense()
            }
        }

        function BudgetItem() {}
        Object.defineProperty(BudgetItem.prototype, 'type', {
            get() {
                return this instanceof Income ? 'income' : this instanceof Expense ? 'expense' : undefined;
            }
        });
        Object.defineProperty(BudgetItem.prototype, 'prefix', {
            get() {
                return this instanceof Income ? '+' : this instanceof Expense ? '-' : undefined;
            }
        });
        Object.prototype.getId = function() {
            let eid = 0;
            let iid = 0;
            return function(type){ return type instanceof Expense ? eid++ : iid++};
        }();
        Object.prototype.getPercentageOf = function(ttlIncome=0) {
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
            } else if(item.type === 'expense') {
                const newExpense = new Expense(item);
                data.items.expense.push(newExpense);
                return newExpense;
            }
        }

        function removeItem(type, id) {
            data.items[type] = data.items[type].filter(item=>item.id!==+id);
        }

        return {
            addItem,
            removeItem,
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
                total: $('.ba__top__total_text'),
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
                    <div class="list__item list__item--${item.type} col flex" id="${item.type}-${item.id}" onclick="">
                        <!--  info  -->
                        <div class="col col--info flex">
                            <div class="col col--description flex flex-aic">${item.description}</div>
                            <div class="col col--amount flex flex-jce flex-aic">${item.prefix}${utils.formatNumber(item.amount)}</div>
                            <div class="col col--percentage flex flex-jce flex-aic">${item.getPercentageOf()}%</div>
                        </div>
                        <!--  actions  -->
                        <div class="col col--actions flex flex-jcc flex-aic">
                            <div class="action action--delete">
                                <button class="btn btn--delete">x</button>
                            </div>
                        </div>
                    </div>
                `
            }
        }

        function addItem(item) {
            elements.lists[item.type].insertAdjacentHTML('afterbegin', templates.item(item));
        }

        function updateTotals(modelTotals) {
            elements.display.income.total.textContent = `${modelTotals.income() > 0 ? '+' : ''}${utils.formatNumber(modelTotals.income())}`;
            elements.display.expense.total.textContent = utils.formatNumber(modelTotals.expense());
            elements.display.total.textContent = `${modelTotals.total() > 0 ? '+' : ''}${utils.formatNumber( modelTotals.total() )}`;
        }

        function removeItem(type, id) {
            const list = elements.lists[type];
            const el = list.querySelector(`#${type}-${id}`);
            list.removeChild(el);
        }

        function updateAllPercentages(items, totals) {
            function updatePercentage(item, ttl) {
                const elId = `${item.type}-${item.id}`;
                const el = elements.lists[item.type].querySelector(`#${elId}`);
                el.querySelector('.col--percentage').textContent = `${utils.formatPercentage(item.getPercentageOf(ttl))}%`;
            }
            items.income.forEach(item=>updatePercentage(item, totals.income()));
            items.expense.forEach(item=>updatePercentage(item, totals.expense()));
        }

        function setDate() {
            const d = new Date();
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'October', 'November', 'December'];
            elements.header.date.textContent = `${months[d.getMonth()]} ${d.getFullYear()}`
        }

        return {
            addItem,
            removeItem,
            updateTotals,
            updateAllPercentages,
            elements,
            setDate
        }
    })();
    
    const mainCtrlModule = ((view, model)=>{
        
        function init() {
            // init event listeners
            view.elements.form.el.addEventListener('submit', onAddItem);
            view.elements.tabs.income.addEventListener('click', onTabClick);
            view.elements.tabs.expense.addEventListener('click', onTabClick);
            view.elements.tabs.both.addEventListener('click', onTabClick);
            view.elements.bottom.addEventListener('click', onListClick);
            // remove after dev
            for (let i = 0; i < 10; i++) {
                view.elements.form.type.value = Math.random() > 0.5 ? 'income' : 'expense';
                view.elements.form.description.value = 'test tester';
                view.elements.form.amount.value = (Math.random() * 2000).toFixed(2);
                view.elements.form.submit.click();
            }
            // init tabs
            view.elements.tabs.income.click();
            // date
            view.setDate()
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
            // update totals
            view.updateTotals(model.data.totals);
            // update percentages
            view.updateAllPercentages(
                model.data.items,
                model.data.totals
            );
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

        function onListClick(e) {
            const itemEl = e.target.closest('.list__item');
            if(!itemEl || !e.target.classList.contains('btn--delete')) return;
            const [type, id] = itemEl.id.split('-');
            model.removeItem(type, id);
            view.removeItem(type, id);
            // update totals
            view.updateTotals(model.data.totals);
            // update percentages
            view.updateAllPercentages(
                model.data.items,
                model.data.totals
            );
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