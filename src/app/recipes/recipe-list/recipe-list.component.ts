import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Recipe} from "./recipe.model";
import {RecipeItemComponent} from "./recipe-item/recipe-item.component";
import {RecipeService} from "../recipe.service";

@Component({
    selector: 'app-recipe-list',
    templateUrl: './recipe-list.component.html',
    styleUrls: ['./recipe-list.component.css']
})
export class RecipeListComponent implements OnInit {

    @Output() recipeSelected = new EventEmitter<Recipe>();

    recipes: Recipe[] | undefined;

    constructor(private recipeService:RecipeService) {

    }

    ngOnInit(): void {
        this.recipes = this.recipeService.recipes;
    }

    onRecipeSelected(recipeElement: Recipe) {
        this.recipeSelected.emit(recipeElement);
    }
}
